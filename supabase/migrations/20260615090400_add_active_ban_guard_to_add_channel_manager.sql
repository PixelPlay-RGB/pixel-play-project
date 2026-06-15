-- add_channel_manager 활성 밴 유저 거부 가드(#119).
-- #118 본문에 "대상이 이 채널의 활성 밴 유저면 매니저로 지정 불가" 한 가지만 additive 로 추가한다.
-- (강퇴된 유저를 매니저로 올리는 모순 방지 — 매니저로 올리려면 먼저 밴을 해제해야 한다.)
-- add_channel_manager 의 기존 raise 는 PX401/PX400/PX404/PX409 뿐이라 밴 거부는 PX403 으로 구분한다.
create or replace function public.add_channel_manager(p_actor_user_id uuid, p_target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_target_user_id is null then
    raise sqlstate 'PX400' using message = 'invalid target';
  end if;

  if p_actor_user_id = p_target_user_id then
    raise sqlstate 'PX400' using message = 'cannot grant manager to self';
  end if;

  if not exists (
    select 1 from public."user" as target_user where target_user.id = p_target_user_id
  ) then
    raise sqlstate 'PX404' using message = 'target user not found';
  end if;

  -- 활성 밴 유저는 매니저로 지정할 수 없다(먼저 밴 해제 필요).
  if exists (
    select 1 from public.channel_viewer_ban as ban
    where ban.creator_id = p_actor_user_id
      and ban.banned_user_id = p_target_user_id
      and ban.unbanned_at is null
  ) then
    raise sqlstate 'PX403' using message = 'cannot grant manager to banned user';
  end if;

  if exists (
    select 1 from public.channel_manager as manager
    where manager.creator_id = p_actor_user_id and manager.manager_id = p_target_user_id
  ) then
    raise sqlstate 'PX409' using message = 'already a manager';
  end if;

  insert into public.channel_manager (creator_id, manager_id, created_by)
  values (p_actor_user_id, p_target_user_id, p_actor_user_id)
  returning id into v_id;

  return jsonb_build_object('managerRelationId', v_id);
end;
$function$;

revoke execute on function public.add_channel_manager(uuid, uuid) from public;
revoke execute on function public.add_channel_manager(uuid, uuid) from anon;
revoke execute on function public.add_channel_manager(uuid, uuid) from authenticated;
grant execute on function public.add_channel_manager(uuid, uuid) to service_role;
