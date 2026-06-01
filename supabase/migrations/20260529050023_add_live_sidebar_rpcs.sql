create or replace function public.get_live_popular_keywords(
  p_limit integer default 5
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 5), 1), 5);
  v_result jsonb;
begin
  with keyword_stat as (
    select
      lower(btrim(tag.value)) as keyword,
      count(*)::integer as live_count,
      coalesce(sum(broadcast.current_viewer_count), 0)::integer as viewer_count
    from public.live_broadcast as broadcast
    cross join lateral unnest(coalesce(broadcast.tags, array[]::text[])) as tag(value)
    where broadcast.ended_at is null
      and btrim(tag.value) <> ''
    group by lower(btrim(tag.value))
  ),
  total_stat as (
    select count(*)::integer as total_count
    from keyword_stat
  ),
  limited_keyword as (
    select *
    from keyword_stat
    order by live_count desc, viewer_count desc, keyword asc
    limit v_limit
  ),
  item_stat as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'keyword', limited_keyword.keyword,
          'liveCount', limited_keyword.live_count,
          'viewerCount', limited_keyword.viewer_count
        )
        order by
          limited_keyword.live_count desc,
          limited_keyword.viewer_count desc,
          limited_keyword.keyword asc
      ),
      '[]'::jsonb
    ) as items
    from limited_keyword
  )
  select jsonb_build_object(
    'items', item_stat.items,
    'totalCount', total_stat.total_count,
    'hasMore', total_stat.total_count > v_limit
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

create or replace function public.get_following_channel_list(
  p_limit integer default 5,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_viewer_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 5), 1), 5);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if v_viewer_id is null then
    return jsonb_build_object('items', '[]'::jsonb, 'totalCount', 0, 'hasMore', false);
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
      broadcast.started_at
    from public.viewer_creator_relation as relation
    join public."user" as creator
      on creator.id = relation.creator_id
    left join public.live_broadcast as broadcast
      on broadcast.creator_id = relation.creator_id
      and broadcast.ended_at is null
    where relation.viewer_id = v_viewer_id
      and relation.followed_at is not null
  ),
  total_stat as (
    select count(*)::integer as total_count
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
          'creatorId', limited_channel.creator_id,
          'creatorNickname', limited_channel.creator_nickname,
          'creatorPhotoUrl', limited_channel.creator_photo_url,
          'followedAt', limited_channel.followed_at,
          'isLive', limited_channel.live_id is not null,
          'liveId', limited_channel.live_id,
          'liveTitle', limited_channel.live_title,
          'thumbnailUrl', limited_channel.thumbnail_url,
          'currentViewerCount', coalesce(limited_channel.current_viewer_count, 0),
          'startedAt', limited_channel.started_at
        )
        order by
          (limited_channel.live_id is not null) desc,
          limited_channel.followed_at desc,
          limited_channel.creator_id asc
      ),
      '[]'::jsonb
    ) as items
    from limited_channel
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

revoke execute on function public.get_live_popular_keywords(integer) from public;
grant execute on function public.get_live_popular_keywords(integer) to anon;
grant execute on function public.get_live_popular_keywords(integer) to authenticated;
grant execute on function public.get_live_popular_keywords(integer) to service_role;

revoke execute on function public.get_following_channel_list(integer, integer) from public;
revoke execute on function public.get_following_channel_list(integer, integer) from anon;
grant execute on function public.get_following_channel_list(integer, integer) to authenticated;
grant execute on function public.get_following_channel_list(integer, integer) to service_role;
