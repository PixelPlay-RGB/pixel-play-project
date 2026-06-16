-- 라이브 클립 삭제(#124): 채널 주인(creator) 또는 클립을 만든 본인(clipper)만 삭제할 수 있다.
-- 행 삭제는 RPC(security definer, service_role 전용)가 권한을 검증해 처리하고, Storage 객체
-- 정리는 호출한 서버 액션이 반환된 경로로 수행한다(live_clip_view는 FK on delete cascade로 함께 정리).

create or replace function public.delete_live_clip(p_actor_user_id uuid, p_clip_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_clip record;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  select clip.id, clip.creator_id, clip.clipper_user_id, clip.storage_path, clip.thumbnail_path
  into v_clip
  from public.live_clip as clip
  where clip.id = p_clip_id;

  if not found then
    raise sqlstate 'PX404' using message = 'clip not found';
  end if;

  -- 채널 주인 또는 클립 제작자만 삭제 가능.
  if p_actor_user_id <> v_clip.creator_id and p_actor_user_id <> v_clip.clipper_user_id then
    raise sqlstate 'PX403' using message = 'not allowed to delete this clip';
  end if;

  delete from public.live_clip where id = p_clip_id;

  -- Storage 정리는 호출한 액션이 수행하도록 경로를 돌려준다.
  return jsonb_build_object(
    'storagePath', v_clip.storage_path,
    'thumbnailPath', v_clip.thumbnail_path
  );
end;
$function$;

revoke execute on function public.delete_live_clip(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_live_clip(uuid, uuid) to service_role;
