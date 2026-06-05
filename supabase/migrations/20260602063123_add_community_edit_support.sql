-- 게시글/댓글 수정 지원: modified_at 컬럼 + update RPC. 조회 RPC가 modifiedAt를 함께 반환합니다.

alter table public.community_post add column if not exists modified_at timestamptz;
alter table public.community_comment add column if not exists modified_at timestamptz;

-- 게시글 수정 (본인 글만)
create or replace function public.update_community_post(
  p_actor_user_id uuid,
  p_post_id uuid,
  p_content text
)
returns boolean language plpgsql security definer set search_path to ''
as $function$
declare
  v_updated integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  if char_length(btrim(coalesce(p_content, ''))) = 0 then
    raise sqlstate 'PX422' using message = 'empty content';
  end if;

  update public.community_post
    set content = btrim(p_content), modified_at = now()
    where id = p_post_id and creator_id = p_actor_user_id;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise sqlstate 'PX403' using message = 'not owner or not found';
  end if;
  return true;
end;
$function$;

-- 댓글 수정 (본인 댓글만)
create or replace function public.update_community_comment(
  p_actor_user_id uuid,
  p_comment_id uuid,
  p_content text
)
returns boolean language plpgsql security definer set search_path to ''
as $function$
declare
  v_updated integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  if char_length(btrim(coalesce(p_content, ''))) = 0 then
    raise sqlstate 'PX422' using message = 'empty content';
  end if;

  update public.community_comment
    set content = btrim(p_content), modified_at = now()
    where id = p_comment_id and author_id = p_actor_user_id;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise sqlstate 'PX403' using message = 'not owner or not found';
  end if;
  return true;
end;
$function$;

-- 조회 RPC 재정의: modifiedAt 추가
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
            'modifiedAt', p.modified_at,
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
    'modifiedAt', p.modified_at,
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
          'createdAt', c.created_at,
          'modifiedAt', c.modified_at
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

-- update RPC service_role 전용
revoke execute on function public.update_community_post(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.update_community_comment(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.update_community_post(uuid, uuid, text) to service_role;
grant execute on function public.update_community_comment(uuid, uuid, text) to service_role;
