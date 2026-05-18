-- 시스템 메시지가 일반 유저 삭제 cascade에 휘말리지 않도록 고정 system user를 사용한다.

do $$
declare
  v_system_user_id constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
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

  update public.message
  set user_id = v_system_user_id
  where message_type = 'system'::public.message_type
    and user_id <> v_system_user_id;
end;
$$;

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
  end if;

  return new;
end;
$function$;

with text_days as (
  select
    message.chat_room_id,
    (message.created_at at time zone 'Asia/Seoul')::date as kst_date,
    min(message.created_at) as first_text_created_at
  from public.message as message
  where message.message_type = 'text'::public.message_type
  group by
    message.chat_room_id,
    (message.created_at at time zone 'Asia/Seoul')::date
),
divider_candidates as (
  select
    text_days.chat_room_id,
    text_days.first_text_created_at,
    '📅 ' ||
      to_char(text_days.kst_date, 'YYYY"년" MM"월" DD"일" ') ||
      case extract(dow from text_days.kst_date)
        when 0 then '일요일'
        when 1 then '월요일'
        when 2 then '화요일'
        when 3 then '수요일'
        when 4 then '목요일'
        when 5 then '금요일'
        when 6 then '토요일'
      end as content
  from text_days
)
insert into public.message (chat_room_id, user_id, content, message_type, created_at)
select
  divider_candidates.chat_room_id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  divider_candidates.content,
  'system'::public.message_type,
  divider_candidates.first_text_created_at - interval '1 millisecond'
from divider_candidates
where not exists (
  select 1
  from public.message as existing
  where existing.chat_room_id = divider_candidates.chat_room_id
    and existing.message_type = 'system'::public.message_type
    and existing.content = divider_candidates.content
)
on conflict (chat_room_id, content)
  where message_type = 'system'::public.message_type
    and content like '📅 %'
do nothing;

revoke execute on function public.insert_date_divider_message() from public;
revoke execute on function public.insert_date_divider_message() from anon;
revoke execute on function public.insert_date_divider_message() from authenticated;
grant execute on function public.insert_date_divider_message() to service_role;
