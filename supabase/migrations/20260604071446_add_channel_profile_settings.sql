-- 채널 관리(#92): creator_studio_setting에 채널 소개(bio) 컬럼 추가,
-- get_channel_profile 확장(bio/isLive), 저장용 update_channel_profile RPC.

alter table public.creator_studio_setting
  add column if not exists channel_bio text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'creator_studio_setting_channel_bio_length') then
    alter table public.creator_studio_setting
      add constraint creator_studio_setting_channel_bio_length check (char_length(channel_bio) <= 500);
  end if;
end$$;

-- get_channel_profile 확장 (시그니처 불변 → ACL 보존). 기존 필드 유지 + bio/isLive.
create or replace function public.get_channel_profile(p_creator_id uuid, p_viewer_id uuid default null)
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
    ),
    'bio', coalesce(s.channel_bio, ''),
    'isLive', exists (
      select 1 from public.live_broadcast b
      where b.creator_id = creator.id and b.ended_at is null
    )
  ) into v_result
  from public."user" creator
  left join public.creator_studio_setting s on s.creator_id = creator.id
  where creator.id = p_creator_id;

  return v_result;
end;
$function$;

-- 채널 소개(bio) 저장(upsert). service_role 전용.
create or replace function public.update_channel_profile(
  p_actor_user_id uuid,
  p_channel_bio text
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  insert into public.creator_studio_setting (creator_id, channel_bio)
  values (p_actor_user_id, coalesce(btrim(p_channel_bio), ''))
  on conflict (creator_id) do update
    set channel_bio = excluded.channel_bio,
        modified_at = now();

  return public.get_channel_profile(p_actor_user_id, p_actor_user_id);
end;
$function$;

revoke execute on function public.update_channel_profile(uuid, text) from public, anon, authenticated;
grant execute on function public.update_channel_profile(uuid, text) to service_role;
