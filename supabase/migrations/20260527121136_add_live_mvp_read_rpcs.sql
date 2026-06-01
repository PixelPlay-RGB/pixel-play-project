-- Live MVP read RPCs.
-- Public reads are intentionally exposed through narrow security definer RPCs.

create or replace function public.get_landing_snapshot()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  with active_broadcast as (
    select
      broadcast.id,
      broadcast.creator_id,
      broadcast.title,
      broadcast.tags,
      broadcast.thumbnail_url,
      broadcast.started_at,
      broadcast.current_viewer_count,
      creator.nickname as creator_nickname,
      creator.photo_url as creator_photo_url
    from public.live_broadcast as broadcast
    join public."user" as creator
      on creator.id = broadcast.creator_id
    where broadcast.ended_at is null
  ),
  live_stat as (
    select
      count(*)::integer as active_live_count,
      coalesce(sum(current_viewer_count), 0)::integer as active_viewer_count
    from active_broadcast
  ),
  chat_stat as (
    select count(*)::integer as active_chat_room_count
    from public.chat_room
  ),
  live_cards as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ranked.id,
          'creatorId', ranked.creator_id,
          'title', ranked.title,
          'creatorNickname', ranked.creator_nickname,
          'creatorPhotoUrl', ranked.creator_photo_url,
          'tags', ranked.tags,
          'thumbnailUrl', ranked.thumbnail_url,
          'currentViewerCount', ranked.current_viewer_count,
          'startedAt', ranked.started_at
        )
        order by ranked.current_viewer_count desc, ranked.started_at desc
      ),
      '[]'::jsonb
    ) as items
    from (
      select *
      from active_broadcast
      order by current_viewer_count desc, started_at desc
      limit 4
    ) as ranked
  ),
  featured_live as (
    select jsonb_build_object(
      'id', broadcast.id,
      'creatorId', broadcast.creator_id,
      'title', broadcast.title,
      'creatorNickname', broadcast.creator_nickname,
      'creatorPhotoUrl', broadcast.creator_photo_url,
      'tags', broadcast.tags,
      'thumbnailUrl', broadcast.thumbnail_url,
      'currentViewerCount', broadcast.current_viewer_count,
      'startedAt', broadcast.started_at
    ) as item
    from active_broadcast as broadcast
    order by broadcast.current_viewer_count desc, broadcast.started_at desc
    limit 1
  ),
  recent_donation as (
    select jsonb_build_object(
      'id', donation.id,
      'broadcastId', donation.broadcast_id,
      'creatorId', donation.creator_id,
      'donorNickname', case when donation.is_anonymous then '익명' else donor.nickname end,
      'amount', donation.amount,
      'message', donation.message,
      'createdAt', donation.created_at
    ) as item
    from public.donation as donation
    join public."user" as donor
      on donor.id = donation.donor_id
    order by donation.created_at desc
    limit 1
  )
  select jsonb_build_object(
    'activeLiveCount', live_stat.active_live_count,
    'activeViewerCount', live_stat.active_viewer_count,
    'activeChatRoomCount', chat_stat.active_chat_room_count,
    'featuredLive', coalesce((select item from featured_live), 'null'::jsonb),
    'liveCards', live_cards.items,
    'recentDonation', coalesce((select item from recent_donation), 'null'::jsonb)
  )
  from live_stat
  cross join chat_stat
  cross join live_cards;
$function$;

create or replace function public.get_live_list(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  creator_id uuid,
  creator_nickname text,
  creator_photo_url text,
  title text,
  tags text[],
  thumbnail_url text,
  current_viewer_count integer,
  started_at timestamp with time zone
)
language sql
stable
security definer
set search_path to ''
as $function$
  select
    broadcast.id,
    broadcast.creator_id,
    creator.nickname as creator_nickname,
    creator.photo_url as creator_photo_url,
    broadcast.title,
    broadcast.tags,
    broadcast.thumbnail_url,
    broadcast.current_viewer_count,
    broadcast.started_at
  from public.live_broadcast as broadcast
  join public."user" as creator
    on creator.id = broadcast.creator_id
  where broadcast.ended_at is null
    and (
      btrim(coalesce(p_query, '')) = ''
      or broadcast.title ilike '%' || btrim(p_query) || '%'
      or creator.nickname ilike '%' || btrim(p_query) || '%'
      or exists (
        select 1
        from unnest(broadcast.tags) as tag
        where tag ilike '%' || btrim(p_query) || '%'
      )
    )
  order by broadcast.current_viewer_count desc, broadcast.started_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;

create or replace function public.get_live_watch(
  p_creator_id uuid,
  p_viewer_id uuid default null
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
          when p_viewer_id is null then jsonb_build_object(
            'canChat', false,
            'blockedReason', 'login_required',
            'remainingFollowWaitSeconds', 0,
            'remainingSlowModeSeconds', 0
          )
          when broadcast.id is null then jsonb_build_object(
            'canChat', false,
            'blockedReason', 'live_offline',
            'remainingFollowWaitSeconds', 0,
            'remainingSlowModeSeconds', 0
          )
          when p_viewer_id = creator.id then jsonb_build_object(
            'canChat', true,
            'blockedReason', 'null'::jsonb,
            'remainingFollowWaitSeconds', 0,
            'remainingSlowModeSeconds', 0
          )
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'manager'::public.live_chat_scope then jsonb_build_object(
            'canChat', false,
            'blockedReason', 'manager_only',
            'remainingFollowWaitSeconds', 0,
            'remainingSlowModeSeconds', 0
          )
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope
            and relation.followed_at is null then jsonb_build_object(
              'canChat', false,
              'blockedReason', 'follower_required',
              'remainingFollowWaitSeconds', coalesce(setting.follower_wait_seconds, 0),
              'remainingSlowModeSeconds', 0
            )
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope
            and relation.followed_at > now() - make_interval(secs => coalesce(setting.follower_wait_seconds, 0)) then jsonb_build_object(
              'canChat', false,
              'blockedReason', 'follower_wait_required',
              'remainingFollowWaitSeconds', greatest(
                ceil(extract(epoch from relation.followed_at + make_interval(secs => coalesce(setting.follower_wait_seconds, 0)) - now()))::integer,
                0
              ),
              'remainingSlowModeSeconds', 0
            )
          when char_length(coalesce(setting.chat_rule_text, '')) > 0
            and coalesce(relation.chat_rule_accepted_version, 0) < coalesce(setting.chat_rule_version, 1) then jsonb_build_object(
              'canChat', false,
              'blockedReason', 'chat_rule_acceptance_required',
              'remainingFollowWaitSeconds', 0,
              'remainingSlowModeSeconds', 0
            )
          when coalesce(setting.slow_mode_enabled, false)
            and last_chat.created_at is not null
            and last_chat.created_at > now() - make_interval(secs => coalesce(setting.slow_mode_seconds, 3)) then jsonb_build_object(
              'canChat', false,
              'blockedReason', 'slow_mode_required',
              'remainingFollowWaitSeconds', 0,
              'remainingSlowModeSeconds', greatest(
                ceil(extract(epoch from last_chat.created_at + make_interval(secs => coalesce(setting.slow_mode_seconds, 3)) - now()))::integer,
                0
              )
            )
          else jsonb_build_object(
            'canChat', true,
            'blockedReason', 'null'::jsonb,
            'remainingFollowWaitSeconds', 0,
            'remainingSlowModeSeconds', 0
          )
        end
      )
      from public."user" as creator
      left join public.creator_studio_setting as setting
        on setting.creator_id = creator.id
      left join lateral (
        select *
        from public.live_broadcast as active_broadcast
        where active_broadcast.creator_id = creator.id
          and active_broadcast.ended_at is null
        order by active_broadcast.started_at desc
        limit 1
      ) as broadcast on true
      left join public.viewer_creator_relation as relation
        on relation.creator_id = creator.id
        and relation.viewer_id = p_viewer_id
      left join lateral (
        select message.created_at
        from public.live_message as message
        where message.broadcast_id = broadcast.id
          and message.sender_id = p_viewer_id
          and message.message_type = 'chat'::public.live_message_type
        order by message.created_at desc
        limit 1
      ) as last_chat on true
      where creator.id = p_creator_id
      limit 1
    ),
    'null'::jsonb
  );
$function$;

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
      'followerWaitSeconds', coalesce(setting.follower_wait_seconds, 0),
      'slowModeEnabled', coalesce(setting.slow_mode_enabled, false),
      'slowModeSeconds', coalesce(setting.slow_mode_seconds, 3),
      'linkBlocked', coalesce(setting.link_blocked, true),
      'forbiddenWords', coalesce(setting.forbidden_words, '{}'::text[]),
      'chatRuleText', coalesce(setting.chat_rule_text, ''),
      'chatRuleVersion', coalesce(setting.chat_rule_version, 1),
      'donationEnabled', coalesce(setting.donation_enabled, true),
      'donationMinAmount', coalesce(setting.donation_min_amount, 1000),
      'donationAmountVisible', coalesce(setting.donation_amount_visible, true),
      'donationAlertEnabled', coalesce(setting.donation_alert_enabled, true),
      'alertSoundEnabled', coalesce(setting.alert_sound_enabled, true),
      'alertVolume', coalesce(setting.alert_volume, 32),
      'ttsEnabled', coalesce(setting.tts_enabled, true),
      'ttsRate', coalesce(setting.tts_rate, 1.00),
      'settlementDemo', coalesce(
        setting.settlement_demo,
        '{"status":"ready","totalAmount":99999,"bankName":"Demo Bank","accountHolder":"PixelPlay Creator"}'::jsonb
      ),
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
  left join public.creator_studio_setting as setting
    on setting.creator_id = creator.id
  left join lateral (
    select *
    from public.live_broadcast as active_broadcast
    where active_broadcast.creator_id = creator.id
      and active_broadcast.ended_at is null
    order by active_broadcast.started_at desc
    limit 1
  ) as broadcast on true
  left join lateral (
    select
      coalesce(sum(donation.amount), 0)::integer as amount_total,
      count(*)::integer as donation_count
    from public.donation as donation
    where donation.creator_id = creator.id
      and donation.created_at >= date_trunc('month', now())
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
      join public."user" as donor
        on donor.id = donation.donor_id
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

create or replace function public.get_creator_donation_dashboard(
  p_actor_user_id uuid,
  p_year integer default null,
  p_month integer default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_year integer := coalesce(p_year, extract(year from now())::integer);
  v_month integer := p_month;
  v_period_start timestamp with time zone;
  v_period_end timestamp with time zone;
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if v_year < 2020 or v_year > 2100 then
    raise sqlstate 'PX400' using message = 'invalid year';
  end if;

  if v_month is not null and (v_month < 1 or v_month > 12) then
    raise sqlstate 'PX400' using message = 'invalid month';
  end if;

  if v_month is null then
    v_period_start := make_date(v_year, 1, 1)::timestamp with time zone;
    v_period_end := make_date(v_year + 1, 1, 1)::timestamp with time zone;
  else
    v_period_start := make_date(v_year, v_month, 1)::timestamp with time zone;
    v_period_end := (make_date(v_year, v_month, 1) + interval '1 month')::timestamp with time zone;
  end if;

  with creator as (
    select target_user.id
    from public."user" as target_user
    where target_user.id = p_actor_user_id
  ),
  setting as (
    select coalesce(
      studio_setting.settlement_demo,
      '{"status":"ready","totalAmount":99999,"bankName":"Demo Bank","accountHolder":"PixelPlay Creator"}'::jsonb
    ) as settlement_demo
    from creator
    left join public.creator_studio_setting as studio_setting
      on studio_setting.creator_id = creator.id
  ),
  period_donation as (
    select donation.*
    from public.donation as donation
    where donation.creator_id = p_actor_user_id
      and donation.created_at >= v_period_start
      and donation.created_at < v_period_end
  ),
  overview as (
    select
      count(*)::integer as donation_count,
      coalesce(sum(amount), 0)::integer as amount_total
    from period_donation
  ),
  monthly_summary as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'month', month_series.month_no,
          'donationCount', coalesce(monthly_stat.donation_count, 0),
          'amountTotal', coalesce(monthly_stat.amount_total, 0)
        )
        order by month_series.month_no
      ),
      '[]'::jsonb
    ) as items
    from generate_series(1, 12) as month_series(month_no)
    left join lateral (
      select
        count(*)::integer as donation_count,
        coalesce(sum(donation.amount), 0)::integer as amount_total
      from public.donation as donation
      where donation.creator_id = p_actor_user_id
        and donation.created_at >= make_date(v_year, month_series.month_no, 1)::timestamp with time zone
        and donation.created_at < (make_date(v_year, month_series.month_no, 1) + interval '1 month')::timestamp with time zone
    ) as monthly_stat on true
  ),
  detail_total as (
    select count(*)::integer as total_count
    from period_donation
  ),
  detail_items as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ranked.id,
          'broadcastId', ranked.broadcast_id,
          'broadcastTitle', ranked.broadcast_title,
          'donorId', ranked.donor_id,
          'donorNickname', case when ranked.is_anonymous then '익명' else ranked.donor_nickname end,
          'amount', ranked.amount,
          'message', ranked.message,
          'status', 'succeeded',
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
        broadcast.title as broadcast_title,
        donation.donor_id,
        donor.nickname as donor_nickname,
        donation.amount,
        donation.message,
        donation.is_anonymous,
        donation.created_at
      from period_donation as donation
      join public."user" as donor
        on donor.id = donation.donor_id
      join public.live_broadcast as broadcast
        on broadcast.id = donation.broadcast_id
      order by donation.created_at desc
      limit v_limit
      offset v_offset
    ) as ranked
  )
  select jsonb_build_object(
    'period', jsonb_build_object(
      'year', v_year,
      'month', v_month,
      'startedAt', v_period_start,
      'endedAt', v_period_end
    ),
    'overview', jsonb_build_object(
      'donationCount', overview.donation_count,
      'amountTotal', overview.amount_total
    ),
    'settlementDemo', setting.settlement_demo,
    'monthlySummary', monthly_summary.items,
    'detailTotalCount', detail_total.total_count,
    'detailItems', detail_items.items
  )
  into v_result
  from creator
  cross join setting
  cross join overview
  cross join monthly_summary
  cross join detail_total
  cross join detail_items;

  if v_result is null then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  return v_result;
end;
$function$;

revoke execute on function public.get_landing_snapshot() from public;
grant execute on function public.get_landing_snapshot() to anon;
grant execute on function public.get_landing_snapshot() to authenticated;
grant execute on function public.get_landing_snapshot() to service_role;

revoke execute on function public.get_live_list(text, integer, integer) from public;
grant execute on function public.get_live_list(text, integer, integer) to anon;
grant execute on function public.get_live_list(text, integer, integer) to authenticated;
grant execute on function public.get_live_list(text, integer, integer) to service_role;

revoke execute on function public.get_live_watch(uuid, uuid) from public;
grant execute on function public.get_live_watch(uuid, uuid) to anon;
grant execute on function public.get_live_watch(uuid, uuid) to authenticated;
grant execute on function public.get_live_watch(uuid, uuid) to service_role;

revoke execute on function public.get_creator_studio_snapshot(uuid) from public;
revoke execute on function public.get_creator_studio_snapshot(uuid) from anon;
revoke execute on function public.get_creator_studio_snapshot(uuid) from authenticated;
grant execute on function public.get_creator_studio_snapshot(uuid) to service_role;

revoke execute on function public.get_creator_donation_dashboard(uuid, integer, integer, integer, integer) from public;
revoke execute on function public.get_creator_donation_dashboard(uuid, integer, integer, integer, integer) from anon;
revoke execute on function public.get_creator_donation_dashboard(uuid, integer, integer, integer, integer) from authenticated;
grant execute on function public.get_creator_donation_dashboard(uuid, integer, integer, integer, integer) to service_role;
