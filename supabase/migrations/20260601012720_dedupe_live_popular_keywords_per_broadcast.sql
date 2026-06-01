-- get_live_popular_keywords: 방송별 정규화 키워드를 먼저 distinct 처리해
-- 한 방송에 ['게임', '게임 '] 같은 중복 태그가 있어도 liveCount/viewerCount가 부풀지 않도록 보정.
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
  with broadcast_keyword as (
    select distinct
      broadcast.id as broadcast_id,
      broadcast.current_viewer_count,
      lower(btrim(tag.value)) as keyword
    from public.live_broadcast as broadcast
    cross join lateral unnest(coalesce(broadcast.tags, array[]::text[])) as tag(value)
    where broadcast.ended_at is null
      and btrim(tag.value) <> ''
  ),
  keyword_stat as (
    select
      keyword,
      count(*)::integer as live_count,
      coalesce(sum(current_viewer_count), 0)::integer as viewer_count
    from broadcast_keyword
    group by keyword
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
        order by limited_keyword.live_count desc, limited_keyword.viewer_count desc, limited_keyword.keyword asc
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
