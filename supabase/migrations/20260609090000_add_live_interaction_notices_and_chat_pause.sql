-- 라이브 채팅 일시정지와 시청자용 상호작용 결과 공지를 기존 테이블에 저장한다.

alter table public.creator_studio_setting
add column if not exists chat_paused boolean not null default false;

create or replace function public.get_creator_studio_snapshot(p_actor_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_result jsonb;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  select jsonb_build_object(
    'settings', jsonb_build_object(
      'defaultTitle', coalesce(setting.default_title, ''),
      'defaultTags', coalesce(setting.default_tags, '{}'::text[]),
      'chatScope', coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope),
      'chatPaused', coalesce(setting.chat_paused, false),
      'followerWaitSeconds', coalesce(setting.follower_wait_seconds, 0),
      'slowModeEnabled', coalesce(setting.slow_mode_enabled, false),
      'slowModeSeconds', coalesce(setting.slow_mode_seconds, 3),
      'linkBlocked', coalesce(setting.link_blocked, true),
      'forbiddenWords', coalesce(setting.forbidden_words, '{}'::text[]),
      'chatRuleText', coalesce(setting.chat_rule_text, ''),
      'chatRuleVersion', coalesce(setting.chat_rule_version, 1),
      'chatDonationMessageEnabled', coalesce(setting.chat_donation_message_enabled, false),
      'donationEnabled', coalesce(setting.donation_enabled, true),
      'donationMinAmount', coalesce(setting.donation_min_amount, 1000),
      'donationAmountVisible', coalesce(setting.donation_amount_visible, true),
      'donationAlertDurationSeconds', coalesce(setting.donation_alert_duration_seconds, 5),
      'alertSoundEnabled', coalesce(setting.alert_sound_enabled, true),
      'alertSoundKey', coalesce(setting.alert_sound_key, 'classic'),
      'alertVolume', coalesce(setting.alert_volume, 32),
      'ttsEnabled', coalesce(setting.tts_enabled, true),
      'ttsRate', coalesce(setting.tts_rate, 1.00),
      'ttsVolume', coalesce(setting.tts_volume, 80),
      'ttsVoiceUri', coalesce(setting.tts_voice_uri, ''),
      'settlementDemo', coalesce(setting.settlement_demo, '{"status":"ready","totalAmount":99999,"bankName":"Demo Bank","accountHolder":"PixelPlay Creator"}'::jsonb),
      'streamKeyVersion', coalesce(setting.stream_key_version, 1),
      'chatOverlayVersion', coalesce(setting.chat_overlay_version, 1),
      'donationAlertVersion', coalesce(setting.donation_alert_version, 1)
    ),
    'activeBroadcast', case
      when broadcast.id is null then 'null'::jsonb
      else jsonb_build_object(
        'id', broadcast.id,
        'title', broadcast.title,
        'tags', broadcast.tags,
        'thumbnailUrl', broadcast.thumbnail_url,
        'startedAt', broadcast.started_at,
        'currentViewerCount', broadcast.current_viewer_count,
        'peakViewerCount', broadcast.peak_viewer_count,
        'chatMessageCount', broadcast.chat_message_count,
        'donationCount', broadcast.donation_count,
        'donationAmountTotal', broadcast.donation_amount_total
      )
    end,
    'monthlyDonation', jsonb_build_object(
      'amountTotal', coalesce(monthly_donation.amount_total, 0),
      'donationCount', coalesce(monthly_donation.donation_count, 0)
    ),
    'recentDonations', coalesce(recent_donation.items, '[]'::jsonb)
  )
  into v_result
  from public."user" as creator
  left join public.creator_studio_setting as setting on setting.creator_id = creator.id
  left join lateral (
    select *
    from public.live_broadcast as active_broadcast
    where active_broadcast.creator_id = creator.id and active_broadcast.ended_at is null
    order by active_broadcast.started_at desc
    limit 1
  ) as broadcast on true
  left join lateral (
    select
      coalesce(sum(donation.amount), 0)::integer as amount_total,
      count(*)::integer as donation_count
    from public.donation as donation
    where donation.creator_id = creator.id
      and donation.created_at >= (date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')
  ) as monthly_donation on true
  left join lateral (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ranked.id,
          'broadcastId', ranked.broadcast_id,
          'donorId', ranked.donor_id,
          'donorNickname', case when ranked.is_anonymous then '익명' else ranked.donor_nickname end,
          'amount', ranked.amount,
          'message', ranked.message,
          'createdAt', ranked.created_at
        )
        order by ranked.created_at desc
      ),
      '[]'::jsonb
    ) as items
    from (
      select
        donation.id,
        donation.broadcast_id,
        donation.donor_id,
        donor.nickname as donor_nickname,
        donation.amount,
        donation.message,
        donation.is_anonymous,
        donation.created_at
      from public.donation as donation
      join public."user" as donor on donor.id = donation.donor_id
      where donation.creator_id = creator.id
      order by donation.created_at desc
      limit 10
    ) as ranked
  ) as recent_donation on true
  where creator.id = p_actor_user_id
  limit 1;

  if v_result is null then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  return v_result;
end;
$function$;

create or replace function public.get_live_watch(
  p_creator_id uuid,
  p_viewer_id uuid default null::uuid
)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce(
    (
      select jsonb_build_object(
        'creator', jsonb_build_object(
          'id', creator.id,
          'nickname', creator.nickname,
          'photoUrl', creator.photo_url
        ),
        'broadcast', case
          when broadcast.id is null then 'null'::jsonb
          else jsonb_build_object(
            'id', broadcast.id,
            'title', broadcast.title,
            'tags', broadcast.tags,
            'thumbnailUrl', broadcast.thumbnail_url,
            'startedAt', broadcast.started_at,
            'currentViewerCount', broadcast.current_viewer_count,
            'peakViewerCount', broadcast.peak_viewer_count,
            'chatMessageCount', broadcast.chat_message_count,
            'donationCount', broadcast.donation_count,
            'donationAmountTotal', broadcast.donation_amount_total
          )
        end,
        'settings', jsonb_build_object(
          'chatScope', coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope),
          'chatPaused', coalesce(setting.chat_paused, false),
          'followerWaitSeconds', coalesce(setting.follower_wait_seconds, 0),
          'slowModeEnabled', coalesce(setting.slow_mode_enabled, false),
          'slowModeSeconds', coalesce(setting.slow_mode_seconds, 3),
          'linkBlocked', coalesce(setting.link_blocked, true),
          'chatRuleText', coalesce(setting.chat_rule_text, ''),
          'chatRuleVersion', coalesce(setting.chat_rule_version, 1),
          'donationEnabled', coalesce(setting.donation_enabled, true),
          'donationMinAmount', coalesce(setting.donation_min_amount, 1000),
          'donationAmountVisible', coalesce(setting.donation_amount_visible, true)
        ),
        'viewerRelation', case
          when p_viewer_id is null then 'null'::jsonb
          else jsonb_build_object(
            'isFollowing', relation.followed_at is not null,
            'followedAt', relation.followed_at,
            'chatRuleAcceptedVersion', relation.chat_rule_accepted_version,
            'chatRuleAcceptedAt', relation.chat_rule_accepted_at
          )
        end,
        'viewerChatState', case
          when p_viewer_id is null then jsonb_build_object('canChat', false, 'blockedReason', 'login_required', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when broadcast.id is null then jsonb_build_object('canChat', false, 'blockedReason', 'live_offline', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when p_viewer_id = creator.id then jsonb_build_object('canChat', true, 'blockedReason', 'null'::jsonb, 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when coalesce(setting.chat_paused, false) then jsonb_build_object('canChat', false, 'blockedReason', 'chat_paused', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'manager'::public.live_chat_scope then jsonb_build_object('canChat', false, 'blockedReason', 'manager_only', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope and relation.followed_at is null then jsonb_build_object('canChat', false, 'blockedReason', 'follower_required', 'remainingFollowWaitSeconds', coalesce(setting.follower_wait_seconds, 0), 'remainingSlowModeSeconds', 0)
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope and relation.followed_at > now() - make_interval(secs => coalesce(setting.follower_wait_seconds, 0)) then jsonb_build_object('canChat', false, 'blockedReason', 'follower_wait_required', 'remainingFollowWaitSeconds', greatest(ceil(extract(epoch from relation.followed_at + make_interval(secs => coalesce(setting.follower_wait_seconds, 0)) - now()))::integer, 0), 'remainingSlowModeSeconds', 0)
          when char_length(coalesce(setting.chat_rule_text, '')) > 0 and coalesce(relation.chat_rule_accepted_version, 0) < coalesce(setting.chat_rule_version, 1) then jsonb_build_object('canChat', false, 'blockedReason', 'chat_rule_acceptance_required', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when coalesce(setting.slow_mode_enabled, false) and last_chat.created_at is not null and last_chat.created_at > now() - make_interval(secs => coalesce(setting.slow_mode_seconds, 3)) then jsonb_build_object('canChat', false, 'blockedReason', 'slow_mode_required', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', greatest(ceil(extract(epoch from last_chat.created_at + make_interval(secs => coalesce(setting.slow_mode_seconds, 3)) - now()))::integer, 0))
          else jsonb_build_object('canChat', true, 'blockedReason', 'null'::jsonb, 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
        end
      )
      from public."user" as creator
      left join public.creator_studio_setting as setting on setting.creator_id = creator.id
      left join lateral (
        select *
        from public.live_broadcast as active_broadcast
        where active_broadcast.creator_id = creator.id and active_broadcast.ended_at is null
        order by active_broadcast.started_at desc
        limit 1
      ) as broadcast on true
      left join public.viewer_creator_relation as relation on relation.creator_id = creator.id and relation.viewer_id = p_viewer_id
      left join lateral (
        select message.created_at
        from public.live_message as message
        where message.broadcast_id = broadcast.id and message.sender_id = p_viewer_id and message.message_type = 'chat'::public.live_message_type
        order by message.created_at desc
        limit 1
      ) as last_chat on true
      where creator.id = p_creator_id
      limit 1
    ),
    'null'::jsonb
  );
$function$;

create or replace function public.set_live_chat_paused(
  p_actor_user_id uuid,
  p_chat_paused boolean
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform 1
  from public."user" as target_user
  where target_user.id = p_actor_user_id;

  if not found then
    raise sqlstate 'PX404' using message = 'user not found';
  end if;

  insert into public.creator_studio_setting as setting (
    creator_id,
    chat_paused
  )
  values (
    p_actor_user_id,
    coalesce(p_chat_paused, false)
  )
  on conflict (creator_id) do update
  set chat_paused = coalesce(p_chat_paused, setting.chat_paused);

  return public.get_creator_studio_snapshot(p_actor_user_id);
end;
$function$;

create or replace function public.send_live_interaction_notice(
  p_actor_user_id uuid,
  p_broadcast_id uuid,
  p_interaction_type text,
  p_content text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_content text := btrim(coalesce(p_content, ''));
  v_interaction_type text := btrim(coalesce(p_interaction_type, ''));
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_message_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_broadcast_id is null then
    raise sqlstate 'PX400' using message = 'invalid broadcast';
  end if;

  if v_interaction_type not in ('poll', 'draw', 'roulette') then
    raise sqlstate 'PX400' using message = 'invalid interaction type';
  end if;

  if char_length(v_content) = 0 or char_length(v_content) > 300 then
    raise sqlstate 'PX400' using message = 'invalid notice content';
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    raise sqlstate 'PX400' using message = 'invalid metadata';
  end if;

  perform 1
  from public.live_broadcast as broadcast
  where broadcast.id = p_broadcast_id
    and broadcast.creator_id = p_actor_user_id
    and broadcast.ended_at is null;

  if not found then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  insert into public.live_message (
    broadcast_id,
    sender_id,
    message_type,
    content,
    metadata
  )
  values (
    p_broadcast_id,
    p_actor_user_id,
    'moderation_notice'::public.live_message_type,
    v_content,
    v_metadata || jsonb_build_object(
      'source', 'live_interaction',
      'interactionType', v_interaction_type
    )
  )
  returning id into v_message_id;

  return v_message_id;
end;
$function$;

create or replace function public.send_live_message_v2(
  p_actor_user_id uuid,
  p_broadcast_id uuid,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_content text := btrim(coalesce(p_content, ''));
  v_broadcast record;
  v_setting public.creator_studio_setting%rowtype;
  v_relation public.viewer_creator_relation%rowtype;
  v_last_message_at timestamp with time zone;
  v_message_id uuid;
  v_forbidden_word text;
  v_sender record;
  v_is_donor boolean := false;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_broadcast_id is null then
    raise sqlstate 'PX400' using message = 'invalid broadcast';
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

  perform pg_advisory_xact_lock(hashtextextended(p_broadcast_id::text || ':' || p_actor_user_id::text, 0));

  select
    broadcast.id,
    broadcast.creator_id
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.id = p_broadcast_id
    and broadcast.ended_at is null;

  if not found then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  select *
  into v_setting
  from public.creator_studio_setting as setting
  where setting.creator_id = v_broadcast.creator_id;

  select *
  into v_relation
  from public.viewer_creator_relation as relation
  where relation.viewer_id = p_actor_user_id
    and relation.creator_id = v_broadcast.creator_id;

  if coalesce(v_setting.chat_paused, false)
    and p_actor_user_id <> v_broadcast.creator_id then
    raise sqlstate 'PX403' using message = 'chat paused';
  end if;

  if coalesce(v_setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'manager'::public.live_chat_scope
    and p_actor_user_id <> v_broadcast.creator_id then
    raise sqlstate 'PX403' using message = 'manager only chat';
  end if;

  if coalesce(v_setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope
    and p_actor_user_id <> v_broadcast.creator_id then
    if v_relation.followed_at is null then
      raise sqlstate 'PX403' using message = 'follower only chat';
    end if;

    if v_relation.followed_at > now() - make_interval(secs => coalesce(v_setting.follower_wait_seconds, 0)) then
      raise sqlstate 'PX403' using message = 'follower wait time required';
    end if;
  end if;

  if char_length(coalesce(v_setting.chat_rule_text, '')) > 0
    and p_actor_user_id <> v_broadcast.creator_id
    and coalesce(v_relation.chat_rule_accepted_version, 0) < coalesce(v_setting.chat_rule_version, 1) then
    raise sqlstate 'PX428' using message = 'chat rule acceptance required';
  end if;

  if coalesce(v_setting.slow_mode_enabled, false)
    and p_actor_user_id <> v_broadcast.creator_id then
    select message.created_at
    into v_last_message_at
    from public.live_message as message
    where message.broadcast_id = p_broadcast_id
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

  if v_forbidden_word is not null then
    return jsonb_build_object(
      'messageId', null,
      'moderated', true
    );
  end if;

  select exists (
    select 1
    from public.donation as donation
    where donation.donor_id = p_actor_user_id
      and donation.creator_id = v_broadcast.creator_id
  )
  into v_is_donor;

  insert into public.live_message (
    broadcast_id,
    sender_id,
    message_type,
    content,
    metadata
  )
  values (
    p_broadcast_id,
    p_actor_user_id,
    'chat'::public.live_message_type,
    v_content,
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

revoke execute on function public.set_live_chat_paused(uuid, boolean) from public;
revoke execute on function public.set_live_chat_paused(uuid, boolean) from anon;
revoke execute on function public.set_live_chat_paused(uuid, boolean) from authenticated;
grant execute on function public.set_live_chat_paused(uuid, boolean) to service_role;

revoke execute on function public.send_live_interaction_notice(uuid, uuid, text, text, jsonb) from public;
revoke execute on function public.send_live_interaction_notice(uuid, uuid, text, text, jsonb) from anon;
revoke execute on function public.send_live_interaction_notice(uuid, uuid, text, text, jsonb) from authenticated;
grant execute on function public.send_live_interaction_notice(uuid, uuid, text, text, jsonb) to service_role;

revoke execute on function public.get_creator_studio_snapshot(uuid) from public;
revoke execute on function public.get_creator_studio_snapshot(uuid) from anon;
revoke execute on function public.get_creator_studio_snapshot(uuid) from authenticated;
grant execute on function public.get_creator_studio_snapshot(uuid) to service_role;

revoke execute on function public.get_live_watch(uuid, uuid) from public;
grant execute on function public.get_live_watch(uuid, uuid) to anon;
grant execute on function public.get_live_watch(uuid, uuid) to authenticated;
grant execute on function public.get_live_watch(uuid, uuid) to service_role;

revoke execute on function public.send_live_message_v2(uuid, uuid, text) from public;
revoke execute on function public.send_live_message_v2(uuid, uuid, text) from anon;
revoke execute on function public.send_live_message_v2(uuid, uuid, text) from authenticated;
grant execute on function public.send_live_message_v2(uuid, uuid, text) to service_role;
