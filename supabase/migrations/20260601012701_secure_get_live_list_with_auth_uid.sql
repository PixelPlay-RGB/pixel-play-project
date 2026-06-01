-- get_live_list: 개인화 기준을 신뢰 불가한 p_viewer_id 대신 auth.uid()로 계산해 IDOR 차단.
-- (p_viewer_id 파라미터는 호환성을 위해 시그니처에 남겨두되 더 이상 신뢰하지 않습니다.)
create or replace function public.get_live_list(
  p_filter text default 'ALL',
  p_sort text default 'VIEWER_COUNT_DESC',
  p_viewer_id uuid default null,
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_excluded_live_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_viewer_id uuid := auth.uid();
  v_filter text := upper(btrim(coalesce(p_filter, 'ALL')));
  v_sort text := upper(btrim(coalesce(p_sort, 'VIEWER_COUNT_DESC')));
  v_query text := btrim(coalesce(p_query, ''));
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if v_filter not in ('ALL', 'FOLLOWING', 'RECENT', 'ACTIVE_CHAT') then
    raise sqlstate 'PX400' using message = 'invalid live filter';
  end if;

  if v_sort not in ('VIEWER_COUNT_DESC', 'STARTED_AT_DESC', 'RECENT_CHAT_DESC') then
    raise sqlstate 'PX400' using message = 'invalid live sort';
  end if;

  with recent_chat as (
    select
      message.broadcast_id,
      count(*)::integer as recent_chat_count
    from public.live_message as message
    where message.message_type = 'chat'::public.live_message_type
      and message.created_at >= now() - interval '5 minutes'
    group by message.broadcast_id
  ),
  filtered_broadcast as (
    select
      broadcast.id,
      broadcast.creator_id,
      creator.nickname as creator_nickname,
      creator.photo_url as creator_photo_url,
      broadcast.title,
      coalesce(broadcast.tags, array[]::text[]) as tags,
      broadcast.thumbnail_url,
      broadcast.current_viewer_count,
      broadcast.started_at,
      coalesce(recent_chat.recent_chat_count, 0)::integer as recent_chat_count,
      (relation.viewer_id is not null) as is_following
    from public.live_broadcast as broadcast
    join public."user" as creator
      on creator.id = broadcast.creator_id
    left join recent_chat
      on recent_chat.broadcast_id = broadcast.id
    left join public.viewer_creator_relation as relation
      on relation.viewer_id = v_viewer_id
      and relation.creator_id = broadcast.creator_id
      and relation.followed_at is not null
    where broadcast.ended_at is null
      and (
        p_excluded_live_id is null
        or broadcast.id <> p_excluded_live_id
      )
      and (
        v_query = ''
        or broadcast.title ilike '%' || v_query || '%'
        or creator.nickname ilike '%' || v_query || '%'
        or exists (
          select 1
          from unnest(coalesce(broadcast.tags, array[]::text[])) as tag(value)
          where tag.value ilike '%' || v_query || '%'
        )
      )
      and (
        v_filter <> 'FOLLOWING'
        or (v_viewer_id is not null and relation.viewer_id is not null)
      )
      and (
        v_filter <> 'RECENT'
        or broadcast.started_at >= now() - interval '30 minutes'
      )
      and (
        v_filter <> 'ACTIVE_CHAT'
        or coalesce(recent_chat.recent_chat_count, 0) > 0
      )
  ),
  total_stat as (
    select count(*)::integer as total_count
    from filtered_broadcast
  ),
  limited_broadcast as (
    select *
    from filtered_broadcast
    order by
      case when v_sort = 'VIEWER_COUNT_DESC' then current_viewer_count end desc nulls last,
      case when v_sort = 'VIEWER_COUNT_DESC' then started_at end desc nulls last,
      case when v_sort = 'STARTED_AT_DESC' then started_at end desc nulls last,
      case when v_sort = 'STARTED_AT_DESC' then current_viewer_count end desc nulls last,
      case when v_sort = 'RECENT_CHAT_DESC' then recent_chat_count end desc nulls last,
      case when v_sort = 'RECENT_CHAT_DESC' then current_viewer_count end desc nulls last,
      case when v_sort = 'RECENT_CHAT_DESC' then started_at end desc nulls last,
      id
    limit v_limit
    offset v_offset
  ),
  item_stat as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', limited_broadcast.id,
          'creatorId', limited_broadcast.creator_id,
          'creatorNickname', limited_broadcast.creator_nickname,
          'creatorPhotoUrl', limited_broadcast.creator_photo_url,
          'title', limited_broadcast.title,
          'tags', limited_broadcast.tags,
          'thumbnailUrl', limited_broadcast.thumbnail_url,
          'currentViewerCount', limited_broadcast.current_viewer_count,
          'startedAt', limited_broadcast.started_at,
          'recentChatCount', limited_broadcast.recent_chat_count,
          'isFollowing', limited_broadcast.is_following
        )
        order by
          case when v_sort = 'VIEWER_COUNT_DESC' then limited_broadcast.current_viewer_count end desc nulls last,
          case when v_sort = 'VIEWER_COUNT_DESC' then limited_broadcast.started_at end desc nulls last,
          case when v_sort = 'STARTED_AT_DESC' then limited_broadcast.started_at end desc nulls last,
          case when v_sort = 'STARTED_AT_DESC' then limited_broadcast.current_viewer_count end desc nulls last,
          case when v_sort = 'RECENT_CHAT_DESC' then limited_broadcast.recent_chat_count end desc nulls last,
          case when v_sort = 'RECENT_CHAT_DESC' then limited_broadcast.current_viewer_count end desc nulls last,
          case when v_sort = 'RECENT_CHAT_DESC' then limited_broadcast.started_at end desc nulls last,
          limited_broadcast.id
      ),
      '[]'::jsonb
    ) as items
    from limited_broadcast
  )
  select jsonb_build_object(
    'items', item_stat.items,
    'totalCount', total_stat.total_count,
    'hasMore', total_stat.total_count > (v_offset + v_limit)
  )
  into v_result
  from total_stat
  cross join item_stat;

  return coalesce(
    v_result,
    jsonb_build_object('items', '[]'::jsonb, 'totalCount', 0, 'hasMore', false)
  );
end;
$function$;
