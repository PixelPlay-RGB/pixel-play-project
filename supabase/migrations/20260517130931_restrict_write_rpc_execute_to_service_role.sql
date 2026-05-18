-- 쓰기 RPC 실행 권한을 Server Action service role 경계로 제한한다.

drop function if exists public.create_chat_room(text, text, integer);
drop function if exists public.join_chat_room(uuid);
drop function if exists public.leave_chat_room(uuid);
drop function if exists public.mark_room_read(uuid);
drop function if exists public.send_chat_message(uuid, text);

create or replace function public.create_chat_room(
  p_actor_user_id uuid,
  p_title text,
  p_description text default '',
  p_max_capacity integer default 2
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_room_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if length(v_title) = 0
    or char_length(v_title) > 50
    or p_max_capacity is null
    or p_max_capacity < 2
    or p_max_capacity > 50
    or char_length(coalesce(v_description, '')) > 200 then
    raise sqlstate 'PX400' using message = 'invalid chat room input';
  end if;

  insert into public.chat_room (owner_id, title, description, max_capacity)
  values (p_actor_user_id, v_title, v_description, p_max_capacity::smallint)
  returning id into v_room_id;

  insert into public.chat_room_member (chat_room_id, user_id, last_joined_at)
  values (v_room_id, p_actor_user_id, now());

  return v_room_id;
end;
$function$;

create or replace function public.join_chat_room(
  p_actor_user_id uuid,
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_current_member integer;
  v_max_capacity integer;
  v_member record;
  v_has_member boolean := false;
begin
  if p_actor_user_id is null then
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
    and member.user_id = p_actor_user_id;

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
      and member.user_id = p_actor_user_id
      and member.is_banned = false
      and member.last_joined_at is null;
  else
    insert into public.chat_room_member (chat_room_id, user_id, last_joined_at)
    values (p_room_id, p_actor_user_id, now());
  end if;
end;
$function$;

create or replace function public.leave_chat_room(
  p_actor_user_id uuid,
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner_id uuid;
  v_current_member integer;
  v_member record;
  v_updated_rows integer;
begin
  if p_actor_user_id is null then
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
    and member.user_id = p_actor_user_id;

  if not found then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;

  if v_member.is_banned or v_member.last_joined_at is null then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;

  if v_owner_id = p_actor_user_id and v_current_member > 1 then
    raise sqlstate 'PX460' using message = 'owner cannot leave';
  end if;

  update public.chat_room_member as member
  set last_joined_at = null
  where member.chat_room_id = p_room_id
    and member.user_id = p_actor_user_id
    and member.is_banned = false
    and member.last_joined_at is not null;

  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;
end;
$function$;

create or replace function public.mark_room_read(
  p_actor_user_id uuid,
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_updated_rows integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  update public.chat_room_member as member
  set last_read_at = greatest(
    coalesce(member.last_read_at, 'epoch'::timestamptz),
    now()
  )
  where member.chat_room_id = p_room_id
    and member.user_id = p_actor_user_id
    and member.is_banned = false
    and member.last_joined_at is not null;

  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;
end;
$function$;

create or replace function public.send_chat_message(
  p_actor_user_id uuid,
  p_room_id uuid,
  p_content text
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_content text := coalesce(p_content, '');
  v_member record;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if length(btrim(v_content)) = 0 or char_length(v_content) > 2000 then
    raise sqlstate 'PX400' using message = 'invalid message content';
  end if;

  perform 1
  from public.chat_room as room
  where room.id = p_room_id;

  if not found then
    raise sqlstate 'PX404' using message = 'room not found';
  end if;

  select member.is_banned, member.last_joined_at
  into v_member
  from public.chat_room_member as member
  where member.chat_room_id = p_room_id
    and member.user_id = p_actor_user_id;

  if not found or v_member.last_joined_at is null then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;

  if v_member.is_banned then
    raise sqlstate 'PX423' using message = 'member is banned';
  end if;

  insert into public.message (chat_room_id, user_id, content, message_type)
  values (p_room_id, p_actor_user_id, v_content, 'text');
end;
$function$;

revoke execute on function public.create_chat_room(uuid, text, text, integer) from public;
revoke execute on function public.create_chat_room(uuid, text, text, integer) from anon;
revoke execute on function public.create_chat_room(uuid, text, text, integer) from authenticated;
grant execute on function public.create_chat_room(uuid, text, text, integer) to service_role;

revoke execute on function public.join_chat_room(uuid, uuid) from public;
revoke execute on function public.join_chat_room(uuid, uuid) from anon;
revoke execute on function public.join_chat_room(uuid, uuid) from authenticated;
grant execute on function public.join_chat_room(uuid, uuid) to service_role;

revoke execute on function public.leave_chat_room(uuid, uuid) from public;
revoke execute on function public.leave_chat_room(uuid, uuid) from anon;
revoke execute on function public.leave_chat_room(uuid, uuid) from authenticated;
grant execute on function public.leave_chat_room(uuid, uuid) to service_role;

revoke execute on function public.mark_room_read(uuid, uuid) from public;
revoke execute on function public.mark_room_read(uuid, uuid) from anon;
revoke execute on function public.mark_room_read(uuid, uuid) from authenticated;
grant execute on function public.mark_room_read(uuid, uuid) to service_role;

revoke execute on function public.send_chat_message(uuid, uuid, text) from public;
revoke execute on function public.send_chat_message(uuid, uuid, text) from anon;
revoke execute on function public.send_chat_message(uuid, uuid, text) from authenticated;
grant execute on function public.send_chat_message(uuid, uuid, text) to service_role;
