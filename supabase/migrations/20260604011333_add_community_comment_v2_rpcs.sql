-- 댓글 v2: 좋아요·정렬·베스트·대댓글 RPC. 전부 SECURITY DEFINER, service_role 전용.

-- 댓글 1건을 화면 jsonb로 변환하는 내부 헬퍼(좋아요수/내가좋아요/대댓글수 포함)
create or replace function public.community_comment_to_json(
  p_comment_id uuid,
  p_viewer_id uuid
)
returns jsonb language sql stable security definer set search_path to ''
as $function$
  select jsonb_build_object(
    'id', c.id,
    'parentId', c.parent_id,
    'authorId', c.author_id,
    'authorNickname', coalesce(nullif(author.nickname, ''), '익명'),
    'authorPhotoUrl', author.photo_url,
    'content', c.content,
    'createdAt', c.created_at,
    'modifiedAt', c.modified_at,
    'likeCount', c.like_count,
    'isLiked', p_viewer_id is not null and exists (
      select 1 from public.community_comment_like l
      where l.comment_id = c.id and l.user_id = p_viewer_id
    ),
    'replyCount', (
      select count(*)::integer from public.community_comment r where r.parent_id = c.id
    )
  )
  from public.community_comment c
  join public."user" author on author.id = c.author_id
  where c.id = p_comment_id;
$function$;

-- 상위댓글 목록(정렬/페이지네이션) + 베스트 1개 + 총개수
drop function if exists public.get_community_comments(uuid, integer, integer);
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
  -- 베스트: 상위댓글 중 좋아요 최다(>=1), 동률은 먼저 작성된 것
  select c.id into v_best_id
  from public.community_comment c
  where c.post_id = p_post_id and c.parent_id is null and c.like_count >= 1
  order by c.like_count desc, c.created_at asc
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
              c.created_at asc
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

-- 대댓글 목록(토글 시 지연 로드, 등록순)
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
    jsonb_agg(public.community_comment_to_json(t.id, p_viewer_id) order by t.created_at asc),
    '[]'::jsonb
  ) into v_result
  from (
    select c.id, c.created_at
    from public.community_comment c
    where c.parent_id = p_parent_id
    order by c.created_at asc
    limit 100
  ) t;

  return v_result;
end;
$function$;

-- 댓글/대댓글 작성: parent_id 있으면 1단계로 평탄화
drop function if exists public.create_community_comment(uuid, uuid, text);
create or replace function public.create_community_comment(
  p_actor_user_id uuid,
  p_post_id uuid,
  p_content text,
  p_parent_id uuid default null
)
returns uuid language plpgsql security definer set search_path to ''
as $function$
declare
  v_comment_id uuid;
  v_root_parent uuid;
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

  if p_parent_id is not null then
    select coalesce(pc.parent_id, pc.id) into v_root_parent
    from public.community_comment pc
    where pc.id = p_parent_id and pc.post_id = p_post_id;
    if v_root_parent is null then
      raise sqlstate 'PX404' using message = 'parent comment not found';
    end if;
  end if;

  insert into public.community_comment (post_id, author_id, content, parent_id)
  values (p_post_id, p_actor_user_id, btrim(p_content), v_root_parent)
  returning id into v_comment_id;

  return v_comment_id;
end;
$function$;

-- 댓글 좋아요 토글
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

-- ACL: 내부 헬퍼 포함 전부 service_role 전용
revoke execute on function public.community_comment_to_json(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.get_community_comments(uuid, uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.get_community_comment_replies(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_community_comment(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke execute on function public.toggle_community_comment_like(uuid, uuid) from public, anon, authenticated;

grant execute on function public.get_community_comments(uuid, uuid, text, integer, integer) to service_role;
grant execute on function public.get_community_comment_replies(uuid, uuid) to service_role;
grant execute on function public.create_community_comment(uuid, uuid, text, uuid) to service_role;
grant execute on function public.toggle_community_comment_like(uuid, uuid) to service_role;
