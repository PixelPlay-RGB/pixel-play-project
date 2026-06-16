-- send_live_message_v4 활성 밴 차단(#119).
-- 매니저 확장본(20260612090300) 본문에 활성 밴 체크 한 가지만 additive 로 추가한다.
-- v4 는 시청 화면 전송(sendLiveMessageAction) 전용 산출물이고, 스튜디오 패널은 v3 를 쓰므로
-- v4 직접 수정이 안전하다(밴 체크는 p_actor_user_id <> p_creator_id 가드 안쪽이라 크리에이터 무영향).
-- 차단 사유는 다른 PX403(매니저/팔로워 전용)과 구분되도록 별도 sqlstate PX451 로 던진다.
-- 정상 흐름은 get_live_watch viewerChatState='banned' 가 입력칸을 먼저 막지만, 강퇴 직후 경합을 서버에서 방어한다.
create or replace function public.send_live_message_v4(p_actor_user_id uuid, p_creator_id uuid, p_content text)
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
  v_is_manager boolean := false;
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

  -- 활성 밴(채널 단위 영구)이면 채팅을 차단한다. 크리에이터 본인은 밴 대상이 아니므로 제외.
  if p_actor_user_id <> p_creator_id and exists (
    select 1
    from public.channel_viewer_ban as ban
    where ban.creator_id = p_creator_id
      and ban.banned_user_id = p_actor_user_id
      and ban.unbanned_at is null
  ) then
    raise sqlstate 'PX451' using message = 'banned from channel';
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

  -- 활성 매니저 여부 — 매니저 전용 채팅 통과와 sender_role 스냅샷에 함께 쓴다.
  select exists (
    select 1
    from public.channel_manager as manager
    where manager.creator_id = p_creator_id and manager.manager_id = p_actor_user_id
  )
  into v_is_manager;

  if coalesce(v_setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'manager'::public.live_chat_scope
    and p_actor_user_id <> p_creator_id
    and not v_is_manager then
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

  -- 금칙어는 리터럴 부분문자열 검사로 비교한다. ilike '%word%' 는 word 안의 % / _ 가
  -- 와일드카드로 해석돼(예: '100%' 가 '100abc' 매칭, '_' 하나로 거의 전체 차단) 오탐을 일으킨다.
  select word
  into v_forbidden_word
  from unnest(coalesce(v_setting.forbidden_words, '{}'::text[])) as word
  where btrim(word) <> ''
    and position(lower(btrim(word)) in lower(v_content)) > 0
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

  -- 전송 시점 역할 스냅샷: 방장 > 매니저 > 후원자 > 일반. (subscriber 는 추후 기능 연결 시 확장한다)
  v_sender_role := case
    when p_actor_user_id = p_creator_id then 'creator'::public.live_sender_role
    when v_is_manager then 'manager'::public.live_sender_role
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

revoke execute on function public.send_live_message_v4(uuid, uuid, text) from public;
revoke execute on function public.send_live_message_v4(uuid, uuid, text) from anon;
revoke execute on function public.send_live_message_v4(uuid, uuid, text) from authenticated;
grant execute on function public.send_live_message_v4(uuid, uuid, text) to service_role;
