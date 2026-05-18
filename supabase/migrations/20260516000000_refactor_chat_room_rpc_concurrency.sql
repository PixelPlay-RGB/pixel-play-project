-- 채팅방 변경성 RPC의 동시성 제어와 안정적인 예외 코드를 정리한다.

create or replace function public.join_chat_room(p_room_id uuid)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_current_member integer;
  v_max_capacity integer;
  v_member record;
  v_has_member boolean := false;
begin
  if v_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_room_id::text, 0));

  select room.current_member, room.max_capacity
  into v_current_member, v_max_capacity
  from public.chat_room as room
  where room.id = p_room_id;

  if not found then
    raise sqlstate 'PX404' using message = 'room not found';
  end if;

  select member.is_banned, member.last_joined_at
  into v_member
  from public.chat_room_member as member
  where member.chat_room_id = p_room_id
    and member.user_id = v_user_id;

  v_has_member := found;

  if v_has_member then
    if v_member.is_banned then
      raise sqlstate 'PX423' using message = 'member is banned';
    end if;

    if v_member.last_joined_at is not null then
      return;
    end if;
  end if;

  if v_current_member >= v_max_capacity then
    raise sqlstate 'PX409' using message = 'chat room is full';
  end if;

  if v_has_member then
    update public.chat_room_member as member
    set last_joined_at = now()
    where member.chat_room_id = p_room_id
      and member.user_id = v_user_id
      and member.is_banned = false
      and member.last_joined_at is null;
  else
    insert into public.chat_room_member (chat_room_id, user_id, last_joined_at)
    values (p_room_id, v_user_id, now());
  end if;
end;
$function$;

create or replace function public.leave_chat_room(p_room_id uuid)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_current_member integer;
  v_member record;
  v_updated_rows integer;
begin
  if v_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_room_id::text, 0));

  select room.owner_id, room.current_member
  into v_owner_id, v_current_member
  from public.chat_room as room
  where room.id = p_room_id;

  if not found then
    raise sqlstate 'PX404' using message = 'room not found';
  end if;

  select member.is_banned, member.last_joined_at
  into v_member
  from public.chat_room_member as member
  where member.chat_room_id = p_room_id
    and member.user_id = v_user_id;

  if not found then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;

  if v_member.is_banned or v_member.last_joined_at is null then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;

  if v_owner_id = v_user_id and v_current_member > 1 then
    raise sqlstate 'PX460' using message = 'owner cannot leave';
  end if;

  update public.chat_room_member as member
  set last_joined_at = null
  where member.chat_room_id = p_room_id
    and member.user_id = v_user_id
    and member.is_banned = false
    and member.last_joined_at is not null;

  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;
end;
$function$;

create or replace function public.mark_room_read(p_room_id uuid)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_updated_rows integer;
begin
  if v_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  update public.chat_room_member as member
  set last_read_at = greatest(
    coalesce(member.last_read_at, 'epoch'::timestamptz),
    now()
  )
  where member.chat_room_id = p_room_id
    and member.user_id = v_user_id
    and member.is_banned = false
    and member.last_joined_at is not null;

  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;
end;
$function$;

create or replace function public.kick_chat_room_member(
  p_room_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_target_member record;
  v_updated_rows integer;
begin
  if v_user_id is null then
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

  if v_owner_id <> v_user_id then
    raise sqlstate 'PX462' using message = 'only owner can manage members';
  end if;

  if p_target_user_id = v_user_id then
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
  p_room_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_target_is_banned boolean;
  v_target_last_joined_at timestamp with time zone;
  v_target_nickname text;
  v_updated_rows integer;
begin
  if v_user_id is null then
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

  if v_owner_id <> v_user_id then
    raise sqlstate 'PX462' using message = 'only owner can manage members';
  end if;

  if p_target_user_id = v_user_id then
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
    and room.owner_id = v_user_id;

  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    raise sqlstate 'PX466' using message = 'owner transfer failed';
  end if;

  insert into public.message (chat_room_id, user_id, content, message_type)
  values (
    p_room_id,
    v_user_id,
    v_target_nickname || '님에게 방장 권한이 위임되었습니다.',
    'system'
  );
end;
$function$;
