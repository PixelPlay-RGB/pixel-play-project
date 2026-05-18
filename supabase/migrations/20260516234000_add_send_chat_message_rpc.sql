-- 메시지 전송 RPC와 메시지 본문 DB 제약을 추가한다.

alter table public.message
  drop constraint if exists message_content_not_blank_and_within_limit;

alter table public.message
  add constraint message_content_not_blank_and_within_limit
  check (length(btrim(content)) > 0 and char_length(content) <= 2000);

create or replace function public.send_chat_message(
  p_room_id uuid,
  p_content text
)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_content text := coalesce(p_content, '');
  v_member record;
begin
  if v_user_id is null then
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
    and member.user_id = v_user_id;

  if not found or v_member.last_joined_at is null then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;

  if v_member.is_banned then
    raise sqlstate 'PX423' using message = 'member is banned';
  end if;

  insert into public.message (chat_room_id, user_id, content, message_type)
  values (p_room_id, v_user_id, v_content, 'text');
end;
$function$;

revoke execute on function public.send_chat_message(uuid, text) from public;
revoke execute on function public.send_chat_message(uuid, text) from anon;
grant execute on function public.send_chat_message(uuid, text) to authenticated;
