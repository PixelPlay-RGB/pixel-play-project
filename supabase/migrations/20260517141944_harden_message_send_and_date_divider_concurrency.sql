-- 메시지 전송과 날짜 구분 시스템 메시지의 동시성 경계를 보강한다.

create unique index if not exists message_date_divider_unique_idx
on public.message (chat_room_id, content)
where message_type = 'system'::public.message_type
  and content like '📅 %';

create or replace function public.insert_date_divider_message()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_kst_date date;
  v_dow text;
  v_content text;
  v_prev_text_today integer;
begin
  if new.message_type = 'system'::public.message_type then
    return new;
  end if;

  v_kst_date := (new.created_at at time zone 'Asia/Seoul')::date;

  select count(*)
  into v_prev_text_today
  from public.message as message
  where message.chat_room_id = new.chat_room_id
    and message.message_type = 'text'::public.message_type
    and (message.created_at at time zone 'Asia/Seoul')::date = v_kst_date
    and message.id <> new.id;

  if v_prev_text_today = 0 then
    v_dow := case extract(dow from v_kst_date)
      when 0 then '일요일'
      when 1 then '월요일'
      when 2 then '화요일'
      when 3 then '수요일'
      when 4 then '목요일'
      when 5 then '금요일'
      when 6 then '토요일'
    end;

    v_content := '📅 ' || to_char(v_kst_date, 'YYYY"년" MM"월" DD"일" ') || v_dow;

    insert into public.message (chat_room_id, user_id, content, message_type, created_at)
    values (
      new.chat_room_id,
      new.user_id,
      v_content,
      'system'::public.message_type,
      new.created_at - interval '1 millisecond'
    )
    on conflict (chat_room_id, content)
      where message_type = 'system'::public.message_type
        and content like '📅 %'
    do nothing;
  end if;

  return new;
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
    and member.user_id = p_actor_user_id
  for update of member;

  if not found or v_member.last_joined_at is null then
    raise sqlstate 'PX461' using message = 'not an active member';
  end if;

  if v_member.is_banned then
    raise sqlstate 'PX423' using message = 'member is banned';
  end if;

  insert into public.message (chat_room_id, user_id, content, message_type)
  values (p_room_id, p_actor_user_id, v_content, 'text'::public.message_type);
end;
$function$;

revoke execute on function public.insert_date_divider_message() from public;
revoke execute on function public.insert_date_divider_message() from anon;
revoke execute on function public.insert_date_divider_message() from authenticated;
grant execute on function public.insert_date_divider_message() to service_role;

revoke execute on function public.send_chat_message(uuid, uuid, text) from public;
revoke execute on function public.send_chat_message(uuid, uuid, text) from anon;
revoke execute on function public.send_chat_message(uuid, uuid, text) from authenticated;
grant execute on function public.send_chat_message(uuid, uuid, text) to service_role;
