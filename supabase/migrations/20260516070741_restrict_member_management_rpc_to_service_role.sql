-- 채팅방 owner 관리 RPC를 서버 전용 실행 경계로 제한한다.

drop function if exists public.kick_chat_room_member(uuid, uuid);
drop function if exists public.transfer_chat_room_owner(uuid, uuid);

create or replace function public.kick_chat_room_member(
  p_actor_user_id uuid,
  p_room_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner_id uuid;
  v_target_member record;
  v_updated_rows integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_room_id::text, 0));

  select room.owner_id
  into v_owner_id
  from public.chat_room as room
  where room.id = p_room_id
  for update;

  if not found then
    raise sqlstate 'PX404' using message = 'room not found';
  end if;

  if v_owner_id <> p_actor_user_id then
    raise sqlstate 'PX462' using message = 'only owner can manage members';
  end if;

  if p_target_user_id = p_actor_user_id then
    raise sqlstate 'PX463' using message = 'owner cannot kick self';
  end if;

  select member.is_banned, member.last_joined_at
  into v_target_member
  from public.chat_room_member as member
  where member.chat_room_id = p_room_id
    and member.user_id = p_target_user_id
  for update;

  if not found then
    raise sqlstate 'PX464' using message = 'target is not an active member';
  end if;

  if v_target_member.is_banned or v_target_member.last_joined_at is null then
    raise sqlstate 'PX464' using message = 'target is not an active member';
  end if;

  update public.chat_room_member as member
  set is_banned = true,
      last_joined_at = null
  where member.chat_room_id = p_room_id
    and member.user_id = p_target_user_id
    and member.is_banned = false
    and member.last_joined_at is not null;

  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    raise sqlstate 'PX464' using message = 'target is not an active member';
  end if;
end;
$function$;

create or replace function public.transfer_chat_room_owner(
  p_actor_user_id uuid,
  p_room_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner_id uuid;
  v_target_is_banned boolean;
  v_target_last_joined_at timestamp with time zone;
  v_target_nickname text;
  v_updated_rows integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_room_id::text, 0));

  select room.owner_id
  into v_owner_id
  from public.chat_room as room
  where room.id = p_room_id
  for update;

  if not found then
    raise sqlstate 'PX404' using message = 'room not found';
  end if;

  if v_owner_id <> p_actor_user_id then
    raise sqlstate 'PX462' using message = 'only owner can manage members';
  end if;

  if p_target_user_id = p_actor_user_id then
    raise sqlstate 'PX465' using message = 'owner cannot transfer to self';
  end if;

  select member.is_banned, member.last_joined_at, target_user.nickname
  into v_target_is_banned, v_target_last_joined_at, v_target_nickname
  from public.chat_room_member as member
  join public."user" as target_user on target_user.id = member.user_id
  where member.chat_room_id = p_room_id
    and member.user_id = p_target_user_id
  for update of member;

  if not found then
    raise sqlstate 'PX464' using message = 'target is not an active member';
  end if;

  if v_target_is_banned or v_target_last_joined_at is null then
    raise sqlstate 'PX464' using message = 'target is not an active member';
  end if;

  update public.chat_room as room
  set owner_id = p_target_user_id
  where room.id = p_room_id
    and room.owner_id = p_actor_user_id;

  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    raise sqlstate 'PX466' using message = 'owner transfer failed';
  end if;

  insert into public.message (chat_room_id, user_id, content, message_type)
  values (
    p_room_id,
    p_actor_user_id,
    v_target_nickname || '님에게 방장 권한이 위임되었습니다.',
    'system'
  );
end;
$function$;

revoke execute on function public.kick_chat_room_member(uuid, uuid, uuid) from public;
revoke execute on function public.transfer_chat_room_owner(uuid, uuid, uuid) from public;

revoke execute on function public.kick_chat_room_member(uuid, uuid, uuid) from anon;
revoke execute on function public.transfer_chat_room_owner(uuid, uuid, uuid) from anon;

revoke execute on function public.kick_chat_room_member(uuid, uuid, uuid) from authenticated;
revoke execute on function public.transfer_chat_room_owner(uuid, uuid, uuid) from authenticated;

grant execute on function public.kick_chat_room_member(uuid, uuid, uuid) to service_role;
grant execute on function public.transfer_chat_room_owner(uuid, uuid, uuid) to service_role;
