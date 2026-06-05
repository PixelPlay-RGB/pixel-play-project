-- 코드리뷰 반영(DB): 게시글 정렬 id 타이브레이커 + 좋아요 토글 원자화 + 좋아요 매핑 공개 select 차단.

-- 1) 게시글 목록 정렬 안정화: created_at 동률 시 id 타이브레이커(댓글 정렬과 동일 패턴).
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

-- 2) 좋아요 토글 원자화: exists 확인 후 insert/delete를 나누면 동시 요청에서 PK 충돌이 날 수 있어
--    delete ... (row_count로 해제 여부 판정) → 없으면 insert ... on conflict do nothing 으로 변경.
create or replace function public.toggle_community_post_like(
  p_actor_user_id uuid,
  p_post_id uuid
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_deleted integer;
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

  delete from public.community_post_like
  where post_id = p_post_id and user_id = p_actor_user_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    insert into public.community_post_like (post_id, user_id)
    values (p_post_id, p_actor_user_id)
    on conflict do nothing;
  end if;

  select like_count into v_like_count from public.community_post where id = p_post_id;

  return jsonb_build_object('liked', v_deleted = 0, 'likeCount', v_like_count);
end;
$function$;

create or replace function public.toggle_community_comment_like(
  p_actor_user_id uuid,
  p_comment_id uuid
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_deleted integer;
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

  delete from public.community_comment_like
  where comment_id = p_comment_id and user_id = p_actor_user_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    insert into public.community_comment_like (comment_id, user_id)
    values (p_comment_id, p_actor_user_id)
    on conflict do nothing;
  end if;

  select like_count into v_like_count from public.community_comment where id = p_comment_id;

  return jsonb_build_object('liked', v_deleted = 0, 'likeCount', v_like_count);
end;
$function$;

-- 3) 좋아요 매핑(누가 무엇을 좋아요했는지)을 anon/authenticated가 직접 SELECT하지 못하도록 공개 정책 제거.
--    likeCount/isLiked는 service_role RPC가 계산해 내려주므로 앱 동작에는 영향 없음(직접 조회 경로 없음 확인).
drop policy if exists "community_post_like_select_all" on public.community_post_like;
drop policy if exists "community_comment_like_select_all" on public.community_comment_like;
