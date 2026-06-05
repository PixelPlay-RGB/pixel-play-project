-- 커뮤니티 게시판 RPC: 조회 3종 + 쓰기 5종. 모두 SECURITY DEFINER, service_role 전용.

-- 1) 채널 게시글 목록 (작성자=크리에이터 정보 + totalCount + isLiked)
create or replace function public.get_channel_community_posts(
  p_creator_id uuid,
  p_viewer_id uuid default null,
  p_limit integer default 10,
  p_offset integer default 0
)
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if p_creator_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'creator', jsonb_build_object(
      'id', creator.id,
      'nickname', coalesce(nullif(creator.nickname, ''), '크리에이터'),
      'photoUrl', creator.photo_url
    ),
    'totalCount', (
      select count(*)::integer from public.community_post p where p.creator_id = creator.id
    ),
    'items', coalesce((
      select jsonb_agg(sub.item order by sub.item_created_at desc)
      from (
        select
          jsonb_build_object(
            'id', p.id,
            'content', p.content,
            'likeCount', p.like_count,
            'commentCount', p.comment_count,
            'createdAt', p.created_at,
            'isLiked', p_viewer_id is not null and exists (
              select 1 from public.community_post_like l
              where l.post_id = p.id and l.user_id = p_viewer_id
            )
          ) as item,
          p.created_at as item_created_at
        from public.community_post p
        where p.creator_id = creator.id
        order by p.created_at desc
        limit v_limit offset v_offset
      ) sub
    ), '[]'::jsonb)
  ) into v_result
  from public."user" creator
  where creator.id = p_creator_id;

  return v_result;
end;
$function$;

-- 2) 게시글 단건
create or replace function public.get_community_post(
  p_post_id uuid,
  p_viewer_id uuid default null
)
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'id', p.id,
    'creatorId', p.creator_id,
    'creatorNickname', coalesce(nullif(creator.nickname, ''), '크리에이터'),
    'creatorPhotoUrl', creator.photo_url,
    'content', p.content,
    'likeCount', p.like_count,
    'commentCount', p.comment_count,
    'createdAt', p.created_at,
    'isLiked', p_viewer_id is not null and exists (
      select 1 from public.community_post_like l
      where l.post_id = p.id and l.user_id = p_viewer_id
    )
  ) into v_result
  from public.community_post p
  join public."user" creator on creator.id = p.creator_id
  where p.id = p_post_id;

  return v_result;
end;
$function$;

-- 3) 댓글 목록
create or replace function public.get_community_comments(
  p_post_id uuid,
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
  select jsonb_build_object(
    'totalCount', (
      select count(*)::integer from public.community_comment c where c.post_id = p_post_id
    ),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'authorId', c.author_id,
          'authorNickname', coalesce(nullif(author.nickname, ''), '익명'),
          'authorPhotoUrl', author.photo_url,
          'content', c.content,
          'createdAt', c.created_at
        ) order by c.created_at desc
      )
      from (
        select * from public.community_comment cc
        where cc.post_id = p_post_id
        order by cc.created_at desc
        limit v_limit offset v_offset
      ) c
      join public."user" author on author.id = c.author_id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

-- 4) 게시글 작성 (작성자 = 채널 주인 본인)
create or replace function public.create_community_post(
  p_actor_user_id uuid,
  p_content text
)
returns uuid language plpgsql security definer set search_path to ''
as $function$
declare
  v_post_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  if char_length(btrim(coalesce(p_content, ''))) = 0 then
    raise sqlstate 'PX422' using message = 'empty content';
  end if;

  insert into public.community_post (creator_id, content)
  values (p_actor_user_id, btrim(p_content))
  returning id into v_post_id;

  return v_post_id;
end;
$function$;

-- 5) 게시글 삭제 (본인 글만)
create or replace function public.delete_community_post(
  p_actor_user_id uuid,
  p_post_id uuid
)
returns boolean language plpgsql security definer set search_path to ''
as $function$
declare
  v_deleted integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  delete from public.community_post
  where id = p_post_id and creator_id = p_actor_user_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise sqlstate 'PX403' using message = 'not owner or not found';
  end if;
  return true;
end;
$function$;

-- 6) 좋아요 토글
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

-- 7) 댓글 작성 (로그인 누구나)
create or replace function public.create_community_comment(
  p_actor_user_id uuid,
  p_post_id uuid,
  p_content text
)
returns uuid language plpgsql security definer set search_path to ''
as $function$
declare
  v_comment_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  if char_length(btrim(coalesce(p_content, ''))) = 0 then
    raise sqlstate 'PX422' using message = 'empty content';
  end if;
  if not exists (select 1 from public.community_post where id = p_post_id) then
    raise sqlstate 'PX404' using message = 'post not found';
  end if;

  insert into public.community_comment (post_id, author_id, content)
  values (p_post_id, p_actor_user_id, btrim(p_content))
  returning id into v_comment_id;

  return v_comment_id;
end;
$function$;

-- 8) 댓글 삭제 (본인 댓글 또는 채널 주인)
create or replace function public.delete_community_comment(
  p_actor_user_id uuid,
  p_comment_id uuid
)
returns boolean language plpgsql security definer set search_path to ''
as $function$
declare
  v_deleted integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  delete from public.community_comment c
  where c.id = p_comment_id
    and (
      c.author_id = p_actor_user_id
      or exists (
        select 1 from public.community_post p
        where p.id = c.post_id and p.creator_id = p_actor_user_id
      )
    );
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise sqlstate 'PX403' using message = 'not allowed or not found';
  end if;
  return true;
end;
$function$;

-- service_role 전용 잠금
revoke execute on function public.get_channel_community_posts(uuid, uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.get_community_post(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.get_community_comments(uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.create_community_post(uuid, text) from public, anon, authenticated;
revoke execute on function public.delete_community_post(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.toggle_community_post_like(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_community_comment(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.delete_community_comment(uuid, uuid) from public, anon, authenticated;

grant execute on function public.get_channel_community_posts(uuid, uuid, integer, integer) to service_role;
grant execute on function public.get_community_post(uuid, uuid) to service_role;
grant execute on function public.get_community_comments(uuid, integer, integer) to service_role;
grant execute on function public.create_community_post(uuid, text) to service_role;
grant execute on function public.delete_community_post(uuid, uuid) to service_role;
grant execute on function public.toggle_community_post_like(uuid, uuid) to service_role;
grant execute on function public.create_community_comment(uuid, uuid, text) to service_role;
grant execute on function public.delete_community_comment(uuid, uuid) to service_role;
