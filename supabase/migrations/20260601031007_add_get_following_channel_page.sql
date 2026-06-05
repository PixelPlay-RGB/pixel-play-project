-- 팔로잉 채널 목록 페이지(/user/following) 전용 RPC.
-- 사이드바용 get_following_channel_list와 달리 limit 캡(5)이 없고,
-- totalCount/liveCount/recentBroadcastCount 통계와 마지막 방송 시각(lastBroadcastAt)을 함께 반환합니다.
create or replace function public.get_following_channel_page(
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_viewer_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 24), 1), 48);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if v_viewer_id is null then
    return jsonb_build_object(
      'items', '[]'::jsonb,
      'totalCount', 0,
      'liveCount', 0,
      'recentBroadcastCount', 0,
      'hasMore', false
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
      )::integer as recent_count
    from following_channel
  ),
  limited_channel as (
    select *
    from following_channel
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
    'hasMore', stat.total_count > (v_offset + v_limit)
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
      'hasMore', false
    )
  );
end;
$function$;

revoke execute on function public.get_following_channel_page(integer, integer) from public;
grant execute on function public.get_following_channel_page(integer, integer) to authenticated;
grant execute on function public.get_following_channel_page(integer, integer) to service_role;
