-- Hero 응답에 시청자 팔로우 여부(isFollowing)를 추가한다 — Hero 아바타 팝오버용.

-- 1) get_live_hero: 유저 컨텍스트(브라우저 JWT) 호출이므로 auth.uid() 기반으로 계산한다.
--    시그니처가 그대로라 create or replace로 기존 ACL(anon·authenticated·service_role)이 보존된다.
create or replace function public.get_live_hero()
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
  select coalesce(
    (
      select jsonb_build_object(
        'id', broadcast.id,
        'creatorId', broadcast.creator_id,
        'title', broadcast.title,
        'creatorNickname', creator.nickname,
        'creatorPhotoUrl', creator.photo_url,
        'tags', broadcast.tags,
        'thumbnailUrl', broadcast.thumbnail_url,
        'currentViewerCount', broadcast.current_viewer_count,
        'startedAt', broadcast.started_at,
        'isFollowing', exists (
          select 1
          from public.viewer_creator_relation as relation
          where relation.creator_id = broadcast.creator_id
            and relation.viewer_id = auth.uid()
            and relation.followed_at is not null
        )
      )
      from public.live_broadcast as broadcast
      join public."user" as creator
        on creator.id = broadcast.creator_id
      where broadcast.ended_at is null
      order by broadcast.current_viewer_count desc, broadcast.started_at desc
      limit 1
    ),
    'null'::jsonb
  );
$function$;

-- 2) get_channel_live_hero: service_role 전용(서버에서 admin client로 호출)이라 viewer를 파라미터로 받는다.
--    파라미터 추가는 새 시그니처이므로 기존 함수를 drop 후 재생성하고 ACL을 다시 잠근다.
drop function if exists public.get_channel_live_hero(uuid);

create function public.get_channel_live_hero(p_creator_id uuid, p_viewer_id uuid default null)
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
  select coalesce(
    (
      select jsonb_build_object(
        'id', broadcast.id,
        'creatorId', broadcast.creator_id,
        'title', broadcast.title,
        'creatorNickname', creator.nickname,
        'creatorPhotoUrl', creator.photo_url,
        'tags', broadcast.tags,
        'thumbnailUrl', broadcast.thumbnail_url,
        'currentViewerCount', broadcast.current_viewer_count,
        'startedAt', broadcast.started_at,
        'isFollowing', exists (
          select 1
          from public.viewer_creator_relation as relation
          where relation.creator_id = broadcast.creator_id
            and relation.viewer_id = p_viewer_id
            and relation.followed_at is not null
        )
      )
      from public.live_broadcast as broadcast
      join public."user" as creator on creator.id = broadcast.creator_id
      where broadcast.ended_at is null and broadcast.creator_id = p_creator_id
      order by broadcast.started_at desc
      limit 1
    ),
    'null'::jsonb
  );
$function$;

revoke execute on function public.get_channel_live_hero(uuid, uuid) from public;
revoke execute on function public.get_channel_live_hero(uuid, uuid) from anon;
revoke execute on function public.get_channel_live_hero(uuid, uuid) from authenticated;
grant execute on function public.get_channel_live_hero(uuid, uuid) to service_role;
