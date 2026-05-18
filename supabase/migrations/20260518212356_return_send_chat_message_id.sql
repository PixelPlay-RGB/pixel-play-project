-- 메시지 낙관적 업데이트 reconcile을 위해 전송 RPC가 생성된 메시지 id를 반환한다.

drop function if exists public.send_chat_message(uuid, uuid, text);

create or replace function public.send_chat_message(
  p_actor_user_id uuid,
  p_room_id uuid,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_content text := coalesce(p_content, '');
  v_member record;
  v_message_id uuid;
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
    and member.user_id = p_actor_user_id
  for update of member;

  if not found or v_member.last_joined_at is null then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;

  if v_member.is_banned then
    raise sqlstate 'PX423' using message = 'member is banned';
  end if;

  insert into public.message (chat_room_id, user_id, content, message_type)
  values (p_room_id, p_actor_user_id, v_content, 'text'::public.message_type)
  returning id into v_message_id;

  return v_message_id;
end;
$function$;

revoke execute on function public.send_chat_message(uuid, uuid, text) from public;
revoke execute on function public.send_chat_message(uuid, uuid, text) from anon;
revoke execute on function public.send_chat_message(uuid, uuid, text) from authenticated;
grant execute on function public.send_chat_message(uuid, uuid, text) to service_role;
