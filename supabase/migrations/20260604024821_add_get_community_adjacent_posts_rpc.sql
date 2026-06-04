-- 게시글 상세의 이전 글(더 오래된)/다음 글(더 최신) 네비게이션.
create or replace function public.get_community_adjacent_posts(p_post_id uuid)
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare
  v_creator uuid;
  v_created timestamptz;
  v_prev jsonb;
  v_next jsonb;
begin
  select creator_id, created_at into v_creator, v_created
  from public.community_post where id = p_post_id;

  if v_creator is null then
    return jsonb_build_object('prev', null, 'next', null);
  end if;

  -- 이전 글(더 오래된): 현재보다 앞선 것 중 가장 가까운 것
  select jsonb_build_object('id', p.id, 'content', p.content) into v_prev
  from public.community_post p
  where p.creator_id = v_creator
    and (p.created_at, p.id) < (v_created, p_post_id)
  order by p.created_at desc, p.id desc
  limit 1;

  -- 다음 글(더 최신): 현재보다 뒤인 것 중 가장 가까운 것
  select jsonb_build_object('id', p.id, 'content', p.content) into v_next
  from public.community_post p
  where p.creator_id = v_creator
    and (p.created_at, p.id) > (v_created, p_post_id)
  order by p.created_at asc, p.id asc
  limit 1;

  return jsonb_build_object('prev', v_prev, 'next', v_next);
end;
$function$;

revoke execute on function public.get_community_adjacent_posts(uuid) from public, anon, authenticated;
grant execute on function public.get_community_adjacent_posts(uuid) to service_role;
