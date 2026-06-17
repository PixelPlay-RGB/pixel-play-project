-- 구독 해지 예약 상태에서도 종료일까지 혜택을 유지하고 재구독으로 active 상태를 복구한다.

create or replace function public.subscribe_creator(p_actor_user_id uuid, p_creator_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_now timestamp with time zone := now();
  v_subscription public.creator_subscription%rowtype;
  v_was_active boolean := false;
  v_was_canceled_entitled boolean := false;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null then
    raise sqlstate 'PX400' using message = 'invalid creator';
  end if;

  if p_actor_user_id = p_creator_id then
    raise sqlstate 'PX400' using message = 'cannot subscribe self';
  end if;

  if not exists (
    select 1
    from public."user" as creator
    where creator.id = p_creator_id
  ) then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  if not exists (
    select 1
    from public."user" as subscriber
    where subscriber.id = p_actor_user_id
  ) then
    raise sqlstate 'PX404' using message = 'subscriber not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_creator_id::text || ':' || p_actor_user_id::text, 0));

  select *
  into v_subscription
  from public.creator_subscription as subscription
  where subscription.creator_id = p_creator_id
    and subscription.subscriber_id = p_actor_user_id;

  v_was_active := coalesce(
    v_subscription.status = 'active'::public.creator_subscription_status
      and v_subscription.end_at > v_now,
    false
  );
  v_was_canceled_entitled := coalesce(
    v_subscription.status = 'canceled'::public.creator_subscription_status
      and v_subscription.end_at > v_now,
    false
  );

  if v_was_active then
    null;
  elsif v_was_canceled_entitled then
    update public.creator_subscription
    set status = 'active'::public.creator_subscription_status
    where id = v_subscription.id
    returning * into v_subscription;
  else
    insert into public.creator_subscription (
      creator_id,
      subscriber_id,
      started_at,
      end_at,
      total_months,
      status
    )
    values (
      p_creator_id,
      p_actor_user_id,
      v_now,
      v_now + interval '1 month',
      1,
      'active'::public.creator_subscription_status
    )
    on conflict (creator_id, subscriber_id)
    do update set
      started_at = v_now,
      end_at = v_now + interval '1 month',
      total_months = public.creator_subscription.total_months + 1,
      status = 'active'::public.creator_subscription_status
    returning * into v_subscription;
  end if;

  return jsonb_build_object(
    'id', v_subscription.id,
    'isSubscribed', v_subscription.status = 'active'::public.creator_subscription_status and v_subscription.end_at > v_now,
    'alreadySubscribed', v_was_active,
    'startedAt', v_subscription.started_at,
    'endAt', v_subscription.end_at,
    'totalMonths', v_subscription.total_months,
    'status', v_subscription.status
  );
end;
$function$;

revoke execute on function public.subscribe_creator(uuid, uuid) from public;
revoke execute on function public.subscribe_creator(uuid, uuid) from anon;
revoke execute on function public.subscribe_creator(uuid, uuid) from authenticated;
grant execute on function public.subscribe_creator(uuid, uuid) to service_role;

create or replace function public.get_live_watch(p_creator_id uuid, p_viewer_id uuid default null::uuid)
 returns jsonb
 language sql
 stable security definer
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
            'isSubscribed', coalesce(
              subscription.status in (
                'active'::public.creator_subscription_status,
                'canceled'::public.creator_subscription_status
              )
                and subscription.end_at > now(),
              false
            ),
            'subscriptionStartedAt', subscription.started_at,
            'subscriptionEndAt', subscription.end_at,
            'subscriptionTotalMonths', subscription.total_months,
            'subscriptionStatus', subscription.status,
            'chatRuleAcceptedVersion', relation.chat_rule_accepted_version,
            'chatRuleAcceptedAt', relation.chat_rule_accepted_at
          )
        end,
        'viewerChatState', case
          when p_viewer_id is null then jsonb_build_object('canChat', false, 'blockedReason', 'login_required', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when broadcast.id is null then jsonb_build_object('canChat', false, 'blockedReason', 'live_offline', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when p_viewer_id = creator.id then jsonb_build_object('canChat', true, 'blockedReason', 'null'::jsonb, 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
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
      left join public.creator_subscription as subscription on subscription.creator_id = creator.id and subscription.subscriber_id = p_viewer_id
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
  v_is_subscriber boolean := false;
  v_subscription_total_months integer;
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

  select word
  into v_forbidden_word
  from unnest(coalesce(v_setting.forbidden_words, '{}'::text[])) as word
  where btrim(word) <> ''
    and position(lower(btrim(word)) in lower(v_content)) > 0
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
      and donation.creator_id = p_creator_id
  )
  into v_is_donor;

  select subscription.total_months
  into v_subscription_total_months
  from public.creator_subscription as subscription
  where subscription.subscriber_id = p_actor_user_id
    and subscription.creator_id = p_creator_id
    and subscription.status in (
      'active'::public.creator_subscription_status,
      'canceled'::public.creator_subscription_status
    )
    and subscription.end_at > now()
  limit 1;

  v_is_subscriber := v_subscription_total_months is not null;

  v_sender_role := case
    when p_actor_user_id = p_creator_id then 'creator'::public.live_sender_role
    when v_is_manager then 'manager'::public.live_sender_role
    when v_is_donor then 'donor'::public.live_sender_role
    when v_is_subscriber then 'subscriber'::public.live_sender_role
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
      'isDonor', v_is_donor,
      'isSubscriber', v_is_subscriber,
      'subscriptionTotalMonths', v_subscription_total_months
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
