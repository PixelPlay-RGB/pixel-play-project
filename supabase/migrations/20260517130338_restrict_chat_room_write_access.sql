-- 채팅방 쓰기 경로를 RPC 중심으로 제한한다.

create or replace function public.create_chat_room(
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
  v_user_id uuid := auth.uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_room_id uuid;
begin
  if v_user_id is null then
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
  values (v_user_id, v_title, v_description, p_max_capacity::smallint)
  returning id into v_room_id;

  insert into public.chat_room_member (chat_room_id, user_id, last_joined_at)
  values (v_room_id, v_user_id, now());

  return v_room_id;
end;
$function$;

alter function public.join_chat_room(uuid) security definer;
alter function public.join_chat_room(uuid) set search_path to '';

alter function public.leave_chat_room(uuid) security definer;
alter function public.leave_chat_room(uuid) set search_path to '';

alter function public.mark_room_read(uuid) security definer;
alter function public.mark_room_read(uuid) set search_path to '';

alter function public.send_chat_message(uuid, text) security definer;
alter function public.send_chat_message(uuid, text) set search_path to '';

alter function public.check_chat_room_capacity_on_rejoin() set search_path to '';
alter function public.update_modified_column() set search_path to '';

drop policy if exists "Users can create own chat rooms"
on public.chat_room;

drop policy if exists "Owners can update own chat rooms"
on public.chat_room;

drop policy if exists "Owners can delete own chat rooms"
on public.chat_room;

drop policy if exists "Users can join rooms as themselves"
on public.chat_room_member;

drop policy if exists "Users can update own room member read and joined state"
on public.chat_room_member;

drop policy if exists "Room members can create own messages"
on public.message;

drop policy if exists "Message authors can update own messages"
on public.message;

drop policy if exists "Message authors can delete own messages"
on public.message;

revoke all privileges on table public.chat_room from public;
revoke all privileges on table public.chat_room from anon;
revoke all privileges on table public.chat_room from authenticated;
grant select on table public.chat_room to authenticated;

revoke all privileges on table public.chat_room_member from public;
revoke all privileges on table public.chat_room_member from anon;
revoke all privileges on table public.chat_room_member from authenticated;
grant select on table public.chat_room_member to authenticated;

revoke all privileges on table public.message from public;
revoke all privileges on table public.message from anon;
revoke all privileges on table public.message from authenticated;
grant select on table public.message to authenticated;

revoke execute on function public.create_chat_room(text, text, integer) from public;
revoke execute on function public.create_chat_room(text, text, integer) from anon;
grant execute on function public.create_chat_room(text, text, integer) to authenticated;
grant execute on function public.create_chat_room(text, text, integer) to service_role;

revoke execute on function public.join_chat_room(uuid) from public;
revoke execute on function public.join_chat_room(uuid) from anon;
grant execute on function public.join_chat_room(uuid) to authenticated;
grant execute on function public.join_chat_room(uuid) to service_role;

revoke execute on function public.leave_chat_room(uuid) from public;
revoke execute on function public.leave_chat_room(uuid) from anon;
grant execute on function public.leave_chat_room(uuid) to authenticated;
grant execute on function public.leave_chat_room(uuid) to service_role;

revoke execute on function public.mark_room_read(uuid) from public;
revoke execute on function public.mark_room_read(uuid) from anon;
grant execute on function public.mark_room_read(uuid) to authenticated;
grant execute on function public.mark_room_read(uuid) to service_role;

revoke execute on function public.send_chat_message(uuid, text) from public;
revoke execute on function public.send_chat_message(uuid, text) from anon;
grant execute on function public.send_chat_message(uuid, text) to authenticated;
grant execute on function public.send_chat_message(uuid, text) to service_role;

revoke execute on function public.update_member_count() from public;
revoke execute on function public.update_member_count() from anon;
revoke execute on function public.update_member_count() from authenticated;
grant execute on function public.update_member_count() to service_role;

revoke execute on function public.insert_chat_room_member_system_message() from public;
revoke execute on function public.insert_chat_room_member_system_message() from anon;
revoke execute on function public.insert_chat_room_member_system_message() from authenticated;
grant execute on function public.insert_chat_room_member_system_message() to service_role;

revoke execute on function public.delete_empty_chat_room() from public;
revoke execute on function public.delete_empty_chat_room() from anon;
revoke execute on function public.delete_empty_chat_room() from authenticated;
grant execute on function public.delete_empty_chat_room() to service_role;

revoke execute on function public.insert_date_divider_message() from public;
revoke execute on function public.insert_date_divider_message() from anon;
revoke execute on function public.insert_date_divider_message() from authenticated;
grant execute on function public.insert_date_divider_message() to service_role;

revoke execute on function public.check_chat_room_capacity_on_rejoin() from public;
revoke execute on function public.check_chat_room_capacity_on_rejoin() from anon;
revoke execute on function public.check_chat_room_capacity_on_rejoin() from authenticated;
grant execute on function public.check_chat_room_capacity_on_rejoin() to service_role;

revoke execute on function public.update_modified_column() from public;
revoke execute on function public.update_modified_column() from anon;
revoke execute on function public.update_modified_column() from authenticated;
grant execute on function public.update_modified_column() to service_role;
