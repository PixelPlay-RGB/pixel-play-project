-- 코드리뷰 반영: 대댓글이 100개를 넘으면 영구히 숨겨지던 문제 → offset/limit 페이지네이션으로 전환.
-- 반환을 배열에서 { items, hasMore } 로 변경(limit+1 조회로 hasMore 판정).

drop function if exists public.get_community_comment_replies(uuid, uuid);

create or replace function public.get_community_comment_replies(
  p_parent_id uuid,
  p_viewer_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  with page as (
    select c.id, c.created_at
    from public.community_comment c
    where c.parent_id = p_parent_id
    order by c.created_at asc, c.id asc
    limit v_limit + 1 offset v_offset
  )
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(public.community_comment_to_json(t.id, p_viewer_id) order by t.created_at asc, t.id asc)
      from (
        select id, created_at from page order by created_at asc, id asc limit v_limit
      ) t
    ), '[]'::jsonb),
    'hasMore', (select count(*) from page) > v_limit
  ) into v_result;

  return v_result;
end;
$function$;

revoke execute on function public.get_community_comment_replies(uuid, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.get_community_comment_replies(uuid, uuid, integer, integer) to service_role;
