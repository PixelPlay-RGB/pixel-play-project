-- 자기 자신이 쓴 글/댓글 좋아요 차단 + 기존 자기 좋아요 정리(트리거가 count 자동 보정).

delete from public.community_post_like l
using public.community_post p
where l.post_id = p.id and l.user_id = p.creator_id;

delete from public.community_comment_like l
using public.community_comment c
where l.comment_id = c.id and l.user_id = c.author_id;

-- 게시글 좋아요 토글: 본인 글이면 차단
create or replace function public.toggle_community_post_like(
  p_actor_user_id uuid,
  p_post_id uuid
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_exists boolean;
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

  select exists (
    select 1 from public.community_post_like
    where post_id = p_post_id and user_id = p_actor_user_id
  ) into v_exists;

  if v_exists then
    delete from public.community_post_like
    where post_id = p_post_id and user_id = p_actor_user_id;
  else
    insert into public.community_post_like (post_id, user_id)
    values (p_post_id, p_actor_user_id);
  end if;

  select like_count into v_like_count from public.community_post where id = p_post_id;

  return jsonb_build_object('liked', not v_exists, 'likeCount', v_like_count);
end;
$function$;

-- 댓글 좋아요 토글: 본인 댓글이면 차단
create or replace function public.toggle_community_comment_like(
  p_actor_user_id uuid,
  p_comment_id uuid
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_exists boolean;
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

  select exists (
    select 1 from public.community_comment_like
    where comment_id = p_comment_id and user_id = p_actor_user_id
  ) into v_exists;

  if v_exists then
    delete from public.community_comment_like
    where comment_id = p_comment_id and user_id = p_actor_user_id;
  else
    insert into public.community_comment_like (comment_id, user_id)
    values (p_comment_id, p_actor_user_id);
  end if;

  select like_count into v_like_count from public.community_comment where id = p_comment_id;

  return jsonb_build_object('liked', not v_exists, 'likeCount', v_like_count);
end;
$function$;
