-- 방송 외 시간에도 채널 단위로 채팅·후원을 받을 수 있게 한다(#111).
-- live_message·donation을 broadcast 종속에서 creator(채널) 스코프로 확장:
-- 방송 중 메시지는 broadcast_id + creator_id 둘 다, 방송 외 메시지는 creator_id만 기록한다.
-- 배포 중인 클라이언트(prod)가 send_live_message_v2 / send_live_donation을 계속 호출하므로
-- 구버전 함수는 그대로 두고 send_live_message_v3 / send_live_donation_v2를 추가한다
-- (클라 전환 배포 후 별도 마이그레이션에서 구버전을 제거한다).

-- 1) live_message 채널 스코프 컬럼 + 백필
alter table public.live_message
  add column creator_id uuid;

update public.live_message as message
set creator_id = broadcast.creator_id
from public.live_broadcast as broadcast
where message.broadcast_id = broadcast.id;

-- 구버전 RPC가 creator_id 없이 insert해도 정합이 유지되게 broadcast에서 채워 주는
-- 트리거 안전망(신·구 RPC 공존 기간 동안 NOT NULL 위반과 조회 누락을 막는다).
create or replace function public.set_live_message_creator_id()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.creator_id is null and new.broadcast_id is not null then
    select broadcast.creator_id
    into new.creator_id
    from public.live_broadcast as broadcast
    where broadcast.id = new.broadcast_id;
  end if;
  return new;
end;
$function$;

drop trigger if exists set_live_message_creator_id on public.live_message;
create trigger set_live_message_creator_id
before insert on public.live_message
for each row
execute function public.set_live_message_creator_id();

alter table public.live_message
  alter column creator_id set not null;

alter table public.live_message
  add constraint live_message_creator_id_fkey
  foreign key (creator_id) references public."user"(id) on delete cascade;

-- 방송 외 메시지는 broadcast 없이 기록된다.
alter table public.live_message
  alter column broadcast_id drop not null;

-- 채널 타임라인 조회와 무한 스크롤 (created_at, id) 커서용 인덱스.
create index if not exists live_message_creator_created_idx
  on public.live_message (creator_id, created_at desc, id desc);

-- 2) donation도 방송 외 후원(채널 후원)을 허용한다. creator_id는 이미 not null.
alter table public.donation
  alter column broadcast_id drop not null;

-- 3) 읽기 RLS: "활성 방송 존재 시만" → 공개 읽기(라이브 채팅은 공개 정보).
-- 방송 외 채팅 표시와 과거 채팅 무한 스크롤(종료 방송 포함) 둘 다 이 변경이 필요하다.
drop policy if exists "Anyone can read active live messages" on public.live_message;
create policy "Anyone can read live messages"
on public.live_message for select
to anon, authenticated
using (true);

-- 4) send_live_message_v3: broadcast 대신 creator 기준. 활성 방송이 있으면 자동 연결한다.
-- v2(20260610151115)와의 차이는 스코프 전환뿐 — 채팅 설정·팔로워 대기·슬로우 모드·금칙어·
-- sender_role 스냅샷 로직은 동일하다(슬로우 모드 직전 메시지 조회만 채널 경계로 바뀐다).
create or replace function public.send_live_message_v3(p_actor_user_id uuid, p_creator_id uuid, p_content text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_content text := btrim(coalesce(p_content, ''));
  v_broadcast_id uuid;
  v_setting public.creator_studio_setting%rowtype;
  v_relation public.viewer_creator_relation%rowtype;
  v_last_message_at timestamp with time zone;
  v_message_id uuid;
  v_forbidden_word text;
  v_sender record;
  v_is_donor boolean := false;
  v_sender_role public.live_sender_role := 'viewer';
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null then
    raise sqlstate 'PX400' using message = 'invalid creator';
  end if;

  if char_length(v_content) = 0 or char_length(v_content) > 2000 then
    raise sqlstate 'PX400' using message = 'invalid message content';
  end if;

  select
    target_user.nickname,
    target_user.photo_url
  into v_sender
  from public."user" as target_user
  where target_user.id = p_actor_user_id;

  if not found then
    raise sqlstate 'PX404' using message = 'user not found';
  end if;

  if not exists (
    select 1
    from public."user" as creator
    where creator.id = p_creator_id
  ) then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_creator_id::text || ':' || p_actor_user_id::text, 0));

  -- 활성 방송이 있으면 메시지를 방송에 귀속시키고, 없으면 채널 메시지로 기록한다.
  select broadcast.id
  into v_broadcast_id
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  select *
  into v_setting
  from public.creator_studio_setting as setting
  where setting.creator_id = p_creator_id;

  select *
  into v_relation
  from public.viewer_creator_relation as relation
  where relation.viewer_id = p_actor_user_id
    and relation.creator_id = p_creator_id;

  if coalesce(v_setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'manager'::public.live_chat_scope
    and p_actor_user_id <> p_creator_id then
    raise sqlstate 'PX403' using message = 'manager only chat';
  end if;

  if coalesce(v_setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope
    and p_actor_user_id <> p_creator_id then
    if v_relation.followed_at is null then
      raise sqlstate 'PX403' using message = 'follower only chat';
    end if;

    if v_relation.followed_at > now() - make_interval(secs => coalesce(v_setting.follower_wait_seconds, 0)) then
      raise sqlstate 'PX403' using message = 'follower wait time required';
    end if;
  end if;

  if char_length(coalesce(v_setting.chat_rule_text, '')) > 0
    and p_actor_user_id <> p_creator_id
    and coalesce(v_relation.chat_rule_accepted_version, 0) < coalesce(v_setting.chat_rule_version, 1) then
    raise sqlstate 'PX428' using message = 'chat rule acceptance required';
  end if;

  if coalesce(v_setting.slow_mode_enabled, false)
    and p_actor_user_id <> p_creator_id then
    select message.created_at
    into v_last_message_at
    from public.live_message as message
    where message.creator_id = p_creator_id
      and message.sender_id = p_actor_user_id
      and message.message_type = 'chat'::public.live_message_type
    order by message.created_at desc
    limit 1;

    if v_last_message_at is not null
      and v_last_message_at > now() - make_interval(secs => coalesce(v_setting.slow_mode_seconds, 3)) then
      raise sqlstate 'PX429' using message = 'slow mode wait required';
    end if;
  end if;

  if coalesce(v_setting.link_blocked, true)
    and v_content ~* '(https?://|www\.)' then
    raise sqlstate 'PX422' using message = 'link is blocked';
  end if;

  select word
  into v_forbidden_word
  from unnest(coalesce(v_setting.forbidden_words, '{}'::text[])) as word
  where btrim(word) <> ''
    and v_content ilike '%' || btrim(word) || '%'
  limit 1;

  -- 금칙어 매칭: 어떤 행도 insert하지 않는다(Realtime fan-out 0). 작성자 본인에게만
  -- 안내가 보이도록 moderated 플래그만 돌려준다.
  if v_forbidden_word is not null then
    return jsonb_build_object(
      'messageId', null,
      'moderated', true
    );
  end if;

  -- 이 크리에이터에게 후원 이력이 있으면 후원자 표시용 플래그를 메시지 메타데이터에 기록한다.
  select exists (
    select 1
    from public.donation as donation
    where donation.donor_id = p_actor_user_id
      and donation.creator_id = p_creator_id
  )
  into v_is_donor;

  -- 전송 시점 역할 스냅샷: 방장 > 후원자 > 일반. (manager·subscriber는 추후 기능 연결 시 계산을 확장한다)
  v_sender_role := case
    when p_actor_user_id = p_creator_id then 'creator'::public.live_sender_role
    when v_is_donor then 'donor'::public.live_sender_role
    else 'viewer'::public.live_sender_role
  end;

  insert into public.live_message (
    broadcast_id,
    creator_id,
    sender_id,
    message_type,
    content,
    sender_role,
    metadata
  )
  values (
    v_broadcast_id,
    p_creator_id,
    p_actor_user_id,
    'chat'::public.live_message_type,
    v_content,
    v_sender_role,
    jsonb_build_object(
      'senderNickname', v_sender.nickname,
      'senderPhotoUrl', v_sender.photo_url,
      'isDonor', v_is_donor
    )
  )
  returning id into v_message_id;

  return jsonb_build_object(
    'messageId', v_message_id,
    'moderated', false
  );
end;
$function$;

revoke execute on function public.send_live_message_v3(uuid, uuid, text) from public;
revoke execute on function public.send_live_message_v3(uuid, uuid, text) from anon;
revoke execute on function public.send_live_message_v3(uuid, uuid, text) from authenticated;
grant execute on function public.send_live_message_v3(uuid, uuid, text) to service_role;

-- 5) send_live_donation_v2: creator 기준 후원. 활성 방송이 있으면 귀속, 없으면 채널 후원.
-- 머니 경로 — 기존 send_live_donation(20260602100000)과의 차이는 스코프 전환뿐이고
-- idempotency·advisory lock·잔액 차감·익명 별칭 로직은 동일하다.
create or replace function public.send_live_donation_v2(
  p_actor_user_id uuid,
  p_creator_id uuid,
  p_amount integer,
  p_message text default '',
  p_is_anonymous boolean default false,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_broadcast_id uuid;
  v_setting public.creator_studio_setting%rowtype;
  v_wallet public.wallet_account%rowtype;
  v_existing_transaction public.wallet_transaction%rowtype;
  v_existing_donation public.donation%rowtype;
  v_transaction_id uuid;
  v_donation_id uuid;
  v_balance_after integer;
  v_donor record;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null then
    raise sqlstate 'PX400' using message = 'invalid creator';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise sqlstate 'PX400' using message = 'invalid donation amount';
  end if;

  if char_length(v_message) > 300 then
    raise sqlstate 'PX400' using message = 'invalid donation message';
  end if;

  if v_idempotency_key = '' then
    raise sqlstate 'PX400' using message = 'idempotency key required';
  end if;

  select
    donor.nickname,
    donor.photo_url
  into v_donor
  from public."user" as donor
  where donor.id = p_actor_user_id;

  if not found then
    raise sqlstate 'PX404' using message = 'donor not found';
  end if;

  select *
  into v_existing_transaction
  from public.wallet_transaction as transaction
  where transaction.idempotency_key = v_idempotency_key;

  if found then
    if v_existing_transaction.user_id <> p_actor_user_id
      or v_existing_transaction.transaction_type <> 'donation_spend'::public.wallet_transaction_type
      or v_existing_transaction.amount_delta <> -p_amount then
      raise sqlstate 'PX409' using message = 'idempotency key conflict';
    end if;

    select *
    into v_existing_donation
    from public.donation as donation
    where donation.wallet_transaction_id = v_existing_transaction.id;

    if not found then
      raise sqlstate 'PX409' using message = 'donation idempotency state conflict';
    end if;

    return jsonb_build_object(
      'donationId', v_existing_donation.id,
      'transactionId', v_existing_transaction.id,
      'balanceAfter', v_existing_transaction.balance_after,
      'replayed', true
    );
  end if;

  if not exists (
    select 1
    from public."user" as creator
    where creator.id = p_creator_id
  ) then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  if p_creator_id = p_actor_user_id then
    raise sqlstate 'PX400' using message = 'creator cannot donate to self';
  end if;

  -- 활성 방송이 있으면 후원을 방송에 귀속시키고, 없으면 채널 후원으로 기록한다.
  select broadcast.id
  into v_broadcast_id
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  select *
  into v_setting
  from public.creator_studio_setting as setting
  where setting.creator_id = p_creator_id;

  if coalesce(v_setting.donation_enabled, true) = false then
    raise sqlstate 'PX403' using message = 'donation disabled';
  end if;

  if p_amount < coalesce(v_setting.donation_min_amount, 1000) then
    raise sqlstate 'PX400' using message = 'donation amount too low';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor_user_id::text || ':wallet', 0));

  insert into public.wallet_account (user_id)
  values (p_actor_user_id)
  on conflict (user_id) do nothing;

  select *
  into v_wallet
  from public.wallet_account as wallet
  where wallet.user_id = p_actor_user_id
  for update;

  if v_wallet.balance_amount < p_amount then
    raise sqlstate 'PX402' using message = 'insufficient wallet balance';
  end if;

  v_balance_after := v_wallet.balance_amount - p_amount;

  update public.wallet_account as wallet
  set balance_amount = v_balance_after
  where wallet.user_id = p_actor_user_id;

  insert into public.wallet_transaction (
    user_id,
    transaction_type,
    transaction_status,
    amount_delta,
    balance_after,
    idempotency_key,
    metadata
  )
  values (
    p_actor_user_id,
    'donation_spend'::public.wallet_transaction_type,
    'succeeded'::public.wallet_transaction_status,
    -p_amount,
    v_balance_after,
    v_idempotency_key,
    jsonb_build_object(
      'broadcastId', v_broadcast_id,
      'creatorId', p_creator_id
    )
  )
  returning id into v_transaction_id;

  insert into public.donation (
    broadcast_id,
    creator_id,
    donor_id,
    wallet_transaction_id,
    amount,
    message,
    is_anonymous
  )
  values (
    v_broadcast_id,
    p_creator_id,
    p_actor_user_id,
    v_transaction_id,
    p_amount,
    v_message,
    coalesce(p_is_anonymous, false)
  )
  returning id into v_donation_id;

  insert into public.live_message (
    broadcast_id,
    creator_id,
    sender_id,
    message_type,
    content,
    donation_id,
    metadata
  )
  values (
    v_broadcast_id,
    p_creator_id,
    case when coalesce(p_is_anonymous, false) then null else p_actor_user_id end,
    'donation'::public.live_message_type,
    v_message,
    v_donation_id,
    jsonb_build_object(
      'donationId', v_donation_id,
      'amount', p_amount,
      'donorNickname', case when coalesce(p_is_anonymous, false) then coalesce(public.anonymous_donor_alias(p_actor_user_id), '익명') else v_donor.nickname end,
      'donorPhotoUrl', case when coalesce(p_is_anonymous, false) then null else v_donor.photo_url end,
      'isAnonymous', coalesce(p_is_anonymous, false)
    )
  );

  return jsonb_build_object(
    'donationId', v_donation_id,
    'transactionId', v_transaction_id,
    'balanceAfter', v_balance_after,
    'replayed', false
  );
end;
$function$;

revoke execute on function public.send_live_donation_v2(uuid, uuid, integer, text, boolean, text) from public;
revoke execute on function public.send_live_donation_v2(uuid, uuid, integer, text, boolean, text) from anon;
revoke execute on function public.send_live_donation_v2(uuid, uuid, integer, text, boolean, text) from authenticated;
grant execute on function public.send_live_donation_v2(uuid, uuid, integer, text, boolean, text) to service_role;

-- 6) OBS 채팅 오버레이 스냅샷: 방송이 없어도 채널(creator) 최근 메시지를 반환한다.
-- 메시지 조회 기준을 broadcast_id → creator_id로 바꾸고, 방송 없음 조기 반환을 제거했다.
create or replace function public.get_live_chat_overlay_snapshot(p_creator_id uuid, p_limit integer default 60)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 60), 1), 100);
  v_broadcast public.live_broadcast%rowtype;
  v_has_broadcast boolean := false;
  v_donation_message_enabled boolean := false;
  v_amount_visible boolean := true;
  v_items jsonb;
begin
  if p_creator_id is null then
    return null;
  end if;

  select
    coalesce(setting.chat_donation_message_enabled, false),
    coalesce(setting.donation_amount_visible, true)
  into v_donation_message_enabled, v_amount_visible
  from public.creator_studio_setting as setting
  where setting.creator_id = p_creator_id;

  select *
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  v_has_broadcast := found;

  select coalesce(jsonb_agg(source.item order by source.created_at asc), '[]'::jsonb)
  into v_items
  from (
    select
      message.created_at,
      case
        when message.message_type = 'donation'::public.live_message_type then jsonb_build_object(
          'type', 'message',
          'message', jsonb_strip_nulls(
            jsonb_build_object(
              'id', message.id,
              'kind', 'donation',
              'author', coalesce(nullif(message.metadata->>'donorNickname', ''), '시청자'),
              'content', message.content,
              'amount', case
                when v_amount_visible and jsonb_typeof(message.metadata->'amount') = 'number'
                  then (message.metadata->>'amount')::integer
                else null
              end,
              'createdAt', message.created_at
            )
          )
        )
        else jsonb_build_object(
          'type', 'message',
          'message', jsonb_strip_nulls(
            jsonb_build_object(
              'id', message.id,
              'kind', 'chat',
              'author', coalesce(nullif(message.metadata->>'senderNickname', ''), '시청자'),
              'content', message.content,
              'createdAt', message.created_at,
              'role', case
                when message.sender_id = p_creator_id then 'creator'
                when (message.metadata->>'isDonor')::boolean then 'donor'
                else null
              end,
              'tone', case when message.sender_id = p_creator_id then 'brand' else null end
            )
          )
        )
      end as item
    from public.live_message as message
    where message.creator_id = p_creator_id
      and (
        message.message_type = 'chat'::public.live_message_type
        or (v_donation_message_enabled and message.message_type = 'donation'::public.live_message_type)
      )
    order by message.created_at desc
    limit v_limit
  ) as source;

  return jsonb_build_object(
    'broadcast', case
      when v_has_broadcast then jsonb_build_object(
        'id', v_broadcast.id,
        'title', v_broadcast.title,
        'creatorId', v_broadcast.creator_id,
        'currentViewerCount', v_broadcast.current_viewer_count,
        'startedAt', v_broadcast.started_at
      )
      else null
    end,
    'donationMessageEnabled', v_donation_message_enabled,
    'donationAmountVisible', v_amount_visible,
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$function$;

-- 7) OBS 후원 알림 오버레이 스냅샷: 방송이 없어도 채널 최근 후원을 반환한다.
create or replace function public.get_live_donation_alert_overlay_snapshot(p_creator_id uuid)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_creator_name text := '크리에이터';
  v_alert_duration_seconds integer := 5;
  v_settings jsonb := '{}'::jsonb;
  v_amount_visible boolean := true;
  v_broadcast public.live_broadcast%rowtype;
  v_has_broadcast boolean := false;
  v_donation jsonb;
begin
  if p_creator_id is null then
    return null;
  end if;

  select
    coalesce(nullif(target_user.nickname, ''), '크리에이터'),
    coalesce(setting.donation_alert_duration_seconds, 5),
    coalesce(setting.donation_amount_visible, true),
    jsonb_build_object(
      'alertSoundEnabled', coalesce(setting.alert_sound_enabled, true),
      'alertSoundKey', coalesce(setting.alert_sound_key, 'classic'),
      'alertVolume', coalesce(setting.alert_volume, 32),
      'ttsEnabled', coalesce(setting.tts_enabled, true),
      'ttsRate', coalesce(setting.tts_rate, 1.0),
      'ttsVolume', coalesce(setting.tts_volume, 80),
      'ttsVoiceUri', coalesce(setting.tts_voice_uri, ''),
      'amountVisible', coalesce(setting.donation_amount_visible, true)
    )
  into v_creator_name, v_alert_duration_seconds, v_amount_visible, v_settings
  from public."user" as target_user
  left join public.creator_studio_setting as setting on setting.creator_id = target_user.id
  where target_user.id = p_creator_id;

  select *
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  v_has_broadcast := found;

  select jsonb_build_object(
    'id', coalesce(message.donation_id, message.id),
    'creatorName', v_creator_name,
    'donorName', coalesce(nullif(message.metadata->>'donorNickname', ''), '시청자'),
    'amount', case when v_amount_visible then (message.metadata->>'amount')::integer else null end,
    'message', message.content,
    'createdAt', message.created_at
  )
  into v_donation
  from public.live_message as message
  where message.creator_id = p_creator_id
    and message.message_type = 'donation'::public.live_message_type
    and jsonb_typeof(message.metadata->'amount') = 'number'
  order by message.created_at desc
  limit 1;

  return jsonb_build_object(
    'broadcastId', case when v_has_broadcast then v_broadcast.id else null end,
    'creatorName', v_creator_name,
    'alertVisibleMs', v_alert_duration_seconds * 1000,
    'donation', v_donation
  ) || v_settings;
end;
$function$;
