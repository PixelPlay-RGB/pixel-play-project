-- Direct RPC for the /live Hero broadcast.
-- The Hero uses the same ordering as the active live list but fetches only one row.

create or replace function public.get_live_hero()
returns jsonb
language sql
stable
security definer
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
        'startedAt', broadcast.started_at
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

revoke execute on function public.get_live_hero() from public;
grant execute on function public.get_live_hero() to anon;
grant execute on function public.get_live_hero() to authenticated;
grant execute on function public.get_live_hero() to service_role;
