-- 코드리뷰 반영: toggle(상태 뒤집기) RPC는 재시도/중복 전달에 비멱등(최종 상태가 요청 횟수 홀짝에 좌우).
-- desired-state(set liked) 방식으로 전환해 멱등성 확보. 본인 좋아요 차단(PX403)은 유지.

create or replace function public.set_community_post_like(
  p_actor_user_id uuid,
  p_post_id uuid,
  p_liked boolean
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_like_count integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  if not exists (select 1 from public.community_post where id = p_post_id) then
    raise sqlstate 'PX404' using message = 'post not found';
  end if;
  if exists (
    select 1 from public.community_post
    where id = p_post_id and creator_id = p_actor_user_id
  ) then
    raise sqlstate 'PX403' using message = 'cannot like own post';
  end if;

  if p_liked then
    insert into public.community_post_like (post_id, user_id)
    values (p_post_id, p_actor_user_id)
    on conflict do nothing;
  else
    delete from public.community_post_like
    where post_id = p_post_id and user_id = p_actor_user_id;
  end if;

  select like_count into v_like_count from public.community_post where id = p_post_id;

  return jsonb_build_object('liked', p_liked, 'likeCount', v_like_count);
end;
$function$;

create or replace function public.set_community_comment_like(
  p_actor_user_id uuid,
  p_comment_id uuid,
  p_liked boolean
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_like_count integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  if not exists (select 1 from public.community_comment where id = p_comment_id) then
    raise sqlstate 'PX404' using message = 'comment not found';
  end if;
  if exists (
    select 1 from public.community_comment
    where id = p_comment_id and author_id = p_actor_user_id
  ) then
    raise sqlstate 'PX403' using message = 'cannot like own comment';
  end if;

  if p_liked then
    insert into public.community_comment_like (comment_id, user_id)
    values (p_comment_id, p_actor_user_id)
    on conflict do nothing;
  else
    delete from public.community_comment_like
    where comment_id = p_comment_id and user_id = p_actor_user_id;
  end if;

  select like_count into v_like_count from public.community_comment where id = p_comment_id;

  return jsonb_build_object('liked', p_liked, 'likeCount', v_like_count);
end;
$function$;

-- 기존 toggle 제거(액션이 set_* 로 전환됨)
drop function if exists public.toggle_community_post_like(uuid, uuid);
drop function if exists public.toggle_community_comment_like(uuid, uuid);

revoke execute on function public.set_community_post_like(uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.set_community_comment_like(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_community_post_like(uuid, uuid, boolean) to service_role;
grant execute on function public.set_community_comment_like(uuid, uuid, boolean) to service_role;
