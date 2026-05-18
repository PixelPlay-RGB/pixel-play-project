-- 날짜 divider를 일반 text 메시지뿐 아니라 system 메시지 날짜에도 생성한다.

create or replace function public.insert_date_divider_message()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_system_user_id constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_kst_date date;
  v_dow text;
  v_content text;
begin
  if new.message_type = 'system'::public.message_type
    and new.content like '📅 %'
  then
    return new;
  end if;

  v_kst_date := (new.created_at at time zone 'Asia/Seoul')::date;

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

  insert into public."user" (
    id,
    email,
    name,
    birth,
    phone,
    gender,
    nickname,
    linked_providers,
    photo_url
  )
  values (
    v_system_user_id,
    'system@pixelplay.local',
    'PixelPlay 시스템',
    '0000-00-00',
    '00000000000',
    'none'::public.gender,
    'PixelPlay 시스템',
    '{}'::public.oauth_provider[],
    null
  )
  on conflict (id) do nothing;

  insert into public.message (chat_room_id, user_id, content, message_type, created_at)
  values (
    new.chat_room_id,
    v_system_user_id,
    v_content,
    'system'::public.message_type,
    new.created_at - interval '1 millisecond'
  )
  on conflict (chat_room_id, content)
    where message_type = 'system'::public.message_type
      and content like '📅 %'
  do nothing;

  return new;
end;
$function$;

with message_days as (
  select
    message.chat_room_id,
    (message.created_at at time zone 'Asia/Seoul')::date as kst_date,
    min(message.created_at) as first_message_created_at
  from public.message as message
  where not (
    message.message_type = 'system'::public.message_type
    and message.content like '📅 %'
  )
  group by
    message.chat_room_id,
    (message.created_at at time zone 'Asia/Seoul')::date
),
divider_candidates as (
  select
    message_days.chat_room_id,
    message_days.first_message_created_at,
    '📅 ' ||
      to_char(message_days.kst_date, 'YYYY"년" MM"월" DD"일" ') ||
      case extract(dow from message_days.kst_date)
        when 0 then '일요일'
        when 1 then '월요일'
        when 2 then '화요일'
        when 3 then '수요일'
        when 4 then '목요일'
        when 5 then '금요일'
        when 6 then '토요일'
      end as content
  from message_days
)
insert into public.message (chat_room_id, user_id, content, message_type, created_at)
select
  divider_candidates.chat_room_id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  divider_candidates.content,
  'system'::public.message_type,
  divider_candidates.first_message_created_at - interval '1 millisecond'
from divider_candidates
on conflict (chat_room_id, content)
  where message_type = 'system'::public.message_type
    and content like '📅 %'
do nothing;

revoke execute on function public.insert_date_divider_message() from public;
revoke execute on function public.insert_date_divider_message() from anon;
revoke execute on function public.insert_date_divider_message() from authenticated;
grant execute on function public.insert_date_divider_message() to service_role;
