-- 공개 채널 헤더용 크리에이터 프로필 조회. 닉네임/사진/팔로워 수 + viewer의 팔로우 여부.
create or replace function public.get_channel_profile(
  p_creator_id uuid,
  p_viewer_id uuid default null
)
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare
  v_result jsonb;
begin
  if p_creator_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', creator.id,
    'nickname', coalesce(nullif(creator.nickname, ''), '크리에이터'),
    'photoUrl', creator.photo_url,
    'followerCount', (
      select count(*)::integer
      from public.viewer_creator_relation r
      where r.creator_id = creator.id and r.followed_at is not null
    ),
    'isFollowing', p_viewer_id is not null and exists (
      select 1 from public.viewer_creator_relation r
      where r.creator_id = creator.id
        and r.viewer_id = p_viewer_id
        and r.followed_at is not null
    )
  ) into v_result
  from public."user" creator
  where creator.id = p_creator_id;

  return v_result;
end;
$function$;

revoke execute on function public.get_channel_profile(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_channel_profile(uuid, uuid) to service_role;
