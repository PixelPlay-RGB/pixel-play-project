-- 댓글 정렬 안정화: best 선정·상위댓글 정렬·대댓글 정렬에 id 최종 타이브레이커 추가.
-- like_count/created_at 동률(특히 popular의 0 좋아요 다수)에서 row_number가 비결정적이라
-- 페이지 경계에서 댓글이 중복/누락되던 문제를 수정. 인접 글 RPC의 (created_at, id) 패턴과 일치.

create or replace function public.get_community_comments(
  p_post_id uuid,
  p_viewer_id uuid default null,
  p_sort text default 'oldest',
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_sort text := lower(coalesce(p_sort, 'oldest'));
  v_best_id uuid;
  v_result jsonb;
begin
  -- 베스트: 상위댓글 중 좋아요 최다(>=1), 동률은 먼저 작성된 것, 그래도 동률이면 id로 확정
  select c.id into v_best_id
  from public.community_comment c
  where c.post_id = p_post_id and c.parent_id is null and c.like_count >= 1
  order by c.like_count desc, c.created_at asc, c.id asc
  limit 1;

  select jsonb_build_object(
    'totalCount', (
      select count(*)::integer from public.community_comment c
      where c.post_id = p_post_id and c.parent_id is null
        and (v_best_id is null or c.id <> v_best_id)
    ),
    'bestComment', case
      when v_best_id is null then null
      else public.community_comment_to_json(v_best_id, p_viewer_id)
    end,
    'items', coalesce((
      select jsonb_agg(public.community_comment_to_json(t.id, p_viewer_id) order by t.ord)
      from (
        select c.id,
          row_number() over (
            order by
              case when v_sort = 'popular' then c.like_count else 0 end desc,
              case when v_sort = 'latest' then c.created_at end desc nulls last,
              case when v_sort = 'oldest' then c.created_at end asc nulls last,
              c.created_at asc,
              c.id asc
          ) as ord
        from public.community_comment c
        where c.post_id = p_post_id and c.parent_id is null
          and (v_best_id is null or c.id <> v_best_id)
      ) t
      where t.ord > v_offset and t.ord <= v_offset + v_limit
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

create or replace function public.get_community_comment_replies(
  p_parent_id uuid,
  p_viewer_id uuid default null
)
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare
  v_result jsonb;
begin
  select coalesce(
    jsonb_agg(public.community_comment_to_json(t.id, p_viewer_id) order by t.created_at asc, t.id asc),
    '[]'::jsonb
  ) into v_result
  from (
    select c.id, c.created_at
    from public.community_comment c
    where c.parent_id = p_parent_id
    order by c.created_at asc, c.id asc
    limit 100
  ) t;

  return v_result;
end;
$function$;
