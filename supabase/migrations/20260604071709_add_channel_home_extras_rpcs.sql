-- 채널 홈(#92): 채널별 Live Hero(라이브 중일 때만 홈 Hero 재사용).

-- 채널별 Live Hero: get_live_hero 복제 + creator 필터(라이브 중일 때만 호출).
create or replace function public.get_channel_live_hero(p_creator_id uuid)
returns jsonb language sql stable security definer set search_path to ''
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
        'startedAt', broadcast.started_at
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

revoke execute on function public.get_channel_live_hero(uuid) from public, anon, authenticated;
grant execute on function public.get_channel_live_hero(uuid) to service_role;
