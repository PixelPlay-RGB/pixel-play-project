-- 커뮤니티 게시글 단일 이미지 첨부: community_post.image_path 컬럼 + RPC 확장.
-- 이미지는 user-media/{creatorId}/community/{uuid}.{ext}에 저장하고 image_path(상대경로)만 보관한다.

alter table public.community_post add column if not exists image_path text;

-- 작성: p_image_path 추가
drop function if exists public.create_community_post(uuid, text);
create or replace function public.create_community_post(
  p_actor_user_id uuid,
  p_content text,
  p_image_path text default null
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

  insert into public.community_post (creator_id, content, image_path)
  values (p_actor_user_id, btrim(p_content), nullif(btrim(coalesce(p_image_path, '')), ''))
  returning id into v_post_id;

  return v_post_id;
end;
$function$;
revoke execute on function public.create_community_post(uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_community_post(uuid, text, text) to service_role;

-- 수정: p_image_path 추가(액션이 최종 경로 계산 — 유지=기존경로, 교체=새경로, 제거=null)
drop function if exists public.update_community_post(uuid, uuid, text);
create or replace function public.update_community_post(
  p_actor_user_id uuid,
  p_post_id uuid,
  p_content text,
  p_image_path text default null
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
    set content = btrim(p_content),
        image_path = nullif(btrim(coalesce(p_image_path, '')), ''),
        modified_at = now()
    where id = p_post_id and creator_id = p_actor_user_id;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise sqlstate 'PX403' using message = 'not owner or not found';
  end if;
  return true;
end;
$function$;
revoke execute on function public.update_community_post(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.update_community_post(uuid, uuid, text, text) to service_role;

-- 삭제: 삭제된 글의 image_path를 반환(액션이 storage 정리). 본인 글만.
drop function if exists public.delete_community_post(uuid, uuid);
create or replace function public.delete_community_post(
  p_actor_user_id uuid,
  p_post_id uuid
)
returns text language plpgsql security definer set search_path to ''
as $function$
declare
  v_image_path text;
  v_deleted integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  delete from public.community_post
  where id = p_post_id and creator_id = p_actor_user_id
  returning image_path into v_image_path;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise sqlstate 'PX403' using message = 'not owner or not found';
  end if;
  return v_image_path;
end;
$function$;
revoke execute on function public.delete_community_post(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_community_post(uuid, uuid) to service_role;

-- 목록 조회: items에 imagePath 추가(시그니처 불변 → ACL 보존).
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
      select jsonb_agg(sub.item order by sub.item_created_at desc, sub.item_id desc)
      from (
        select
          jsonb_build_object(
            'id', p.id,
            'content', p.content,
            'imagePath', p.image_path,
            'likeCount', p.like_count,
            'commentCount', p.comment_count,
            'createdAt', p.created_at,
            'modifiedAt', p.modified_at,
            'isLiked', p_viewer_id is not null and exists (
              select 1 from public.community_post_like l
              where l.post_id = p.id and l.user_id = p_viewer_id
            )
          ) as item,
          p.created_at as item_created_at,
          p.id as item_id
        from public.community_post p
        where p.creator_id = creator.id
        order by p.created_at desc, p.id desc
        limit v_limit offset v_offset
      ) sub
    ), '[]'::jsonb)
  ) into v_result
  from public."user" creator
  where creator.id = p_creator_id;

  return v_result;
end;
$function$;

-- 단건 조회: imagePath 추가.
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
    'imagePath', p.image_path,
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
