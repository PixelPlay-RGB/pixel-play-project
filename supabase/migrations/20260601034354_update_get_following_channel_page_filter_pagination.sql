-- 팔로잉 채널 페이지에 필터(ALL/LIVE)와 페이지 단위(기본 10개) 페이지네이션을 지원하도록 교체.
-- 통계(totalCount/liveCount/recentBroadcastCount)는 전체 팔로잉 기준, filteredCount는 현재 필터 기준(페이지 수 계산용).
drop function if exists public.get_following_channel_page(integer, integer);

create or replace function public.get_following_channel_page(
  p_filter text default 'ALL',
  p_limit integer default 10,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_viewer_id uuid := auth.uid();
  v_filter text := upper(coalesce(p_filter, 'ALL'));
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if v_filter not in ('ALL', 'LIVE') then
    v_filter := 'ALL';
  end if;

  if v_viewer_id is null then
    return jsonb_build_object(
      'items', '[]'::jsonb,
      'totalCount', 0,
      'liveCount', 0,
      'recentBroadcastCount', 0,
      'filteredCount', 0
    );
  end if;

  with following_channel as (
    select
      relation.creator_id,
      creator.nickname as creator_nickname,
      creator.photo_url as creator_photo_url,
      relation.followed_at,
      broadcast.id as live_id,
      broadcast.title as live_title,
      broadcast.thumbnail_url,
      broadcast.current_viewer_count,
      broadcast.started_at,
      recent.last_broadcast_at
    from public.viewer_creator_relation as relation
    join public."user" as creator
      on creator.id = relation.creator_id
    left join public.live_broadcast as broadcast
      on broadcast.creator_id = relation.creator_id
      and broadcast.ended_at is null
    left join lateral (
      select max(b.started_at) as last_broadcast_at
      from public.live_broadcast as b
      where b.creator_id = relation.creator_id
    ) as recent on true
    where relation.viewer_id = v_viewer_id
      and relation.followed_at is not null
  ),
  stat as (
    select
      count(*)::integer as total_count,
      count(*) filter (where live_id is not null)::integer as live_count,
      count(*) filter (
        where last_broadcast_at is not null
          and last_broadcast_at >= (now() - interval '7 days')
      )::integer as recent_count,
      count(*) filter (where v_filter <> 'LIVE' or live_id is not null)::integer as filtered_count
    from following_channel
  ),
  limited_channel as (
    select *
    from following_channel
    where v_filter <> 'LIVE' or live_id is not null
    order by (live_id is not null) desc, followed_at desc, creator_id asc
    limit v_limit
    offset v_offset
  ),
  item_stat as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'creatorId', creator_id,
          'creatorNickname', creator_nickname,
          'creatorPhotoUrl', creator_photo_url,
          'followedAt', followed_at,
          'isLive', live_id is not null,
          'liveId', live_id,
          'liveTitle', live_title,
          'thumbnailUrl', thumbnail_url,
          'currentViewerCount', coalesce(current_viewer_count, 0),
          'startedAt', started_at,
          'lastBroadcastAt', last_broadcast_at
        )
        order by (live_id is not null) desc, followed_at desc, creator_id asc
      ),
      '[]'::jsonb
    ) as items
    from limited_channel
  )
  select jsonb_build_object(
    'items', item_stat.items,
    'totalCount', stat.total_count,
    'liveCount', stat.live_count,
    'recentBroadcastCount', stat.recent_count,
    'filteredCount', stat.filtered_count
  )
  into v_result
  from stat
  cross join item_stat;

  return coalesce(
    v_result,
    jsonb_build_object(
      'items', '[]'::jsonb,
      'totalCount', 0,
      'liveCount', 0,
      'recentBroadcastCount', 0,
      'filteredCount', 0
    )
  );
end;
$function$;

revoke execute on function public.get_following_channel_page(text, integer, integer) from public;
grant execute on function public.get_following_channel_page(text, integer, integer) to authenticated;
grant execute on function public.get_following_channel_page(text, integer, integer) to service_role;
