-- get_live_watch settings에 forbiddenWords를 추가한다(GAP-017: 금칙어 원문 깜빡임 제거).
-- 시청자 client가 서버(send_live_message_v4)와 동일하게 전송 직전 선검사해 optimistic 원문이
-- 한 프레임도 안 뜨게 한다. 매칭은 단순 case-insensitive 부분일치라 client 재현이 정확하다.

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
          'donationAmountVisible', coalesce(setting.donation_amount_visible, true),
          'forbiddenWords', coalesce(setting.forbidden_words, '{}'::text[])
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
            'chatRuleAcceptedAt', relation.chat_rule_accepted_at,
            'isManager', exists(
              select 1 from public.channel_manager m
              where m.creator_id = creator.id and m.manager_id = p_viewer_id
            ),
            'isBanned', exists(
              select 1 from public.channel_viewer_ban b
              where b.creator_id = creator.id and b.banned_user_id = p_viewer_id and b.unbanned_at is null
            )
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
