-- get_rooms_by_tab_count에 p_query 파라미터 추가 (탭 내 채팅방 제목 검색)
-- RETURNS에 total_count(윈도우 함수) 추가 → 검색 결과의 전체 개수 반환
-- 시그니처 변경으로 기존 5-파라미터 함수 DROP 후 재생성

DROP FUNCTION IF EXISTS public.get_rooms_by_tab_count(uuid, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_rooms_by_tab_count(
  p_user_id    uuid,
  p_tab_type   text,
  p_sort_option text    DEFAULT 'CREATED_AT_DESC',
  p_limit      integer  DEFAULT 30,
  p_offset     integer  DEFAULT 0,
  p_query      text     DEFAULT NULL
)
RETURNS TABLE(
  id              uuid,
  title           text,
  description     text,
  max_capacity    integer,
  current_member  integer,
  owner_id        uuid,
  owner_nickname  text,
  created_at      timestamp with time zone,
  unread_count    integer,
  total_count     integer
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
declare
  v_tab_type   text := upper(coalesce(p_tab_type, ''));
  v_sort_option text := upper(coalesce(p_sort_option, 'CREATED_AT_DESC'));
  v_query      text := nullif(btrim(coalesce(p_query, '')), '');
begin
  if v_sort_option not in ('CREATED_AT_DESC', 'LAST_MESSAGE_DESC', 'CURRENT_MEMBER_DESC') then
    v_sort_option := 'CREATED_AT_DESC';
  end if;

  -- NOT_JOINED는 최신 메시지순 미지원 → 기본값으로 리셋
  if v_tab_type = 'NOT_JOINED' and v_sort_option = 'LAST_MESSAGE_DESC' then
    v_sort_option := 'CREATED_AT_DESC';
  end if;

  if v_tab_type = 'OWNED' then
    return query
    select
      room.id,
      room.title,
      room.description,
      room.max_capacity::integer,
      room.current_member,
      room.owner_id,
      owner.nickname,
      room.created_at,
      coalesce(
        (
          select count(*)::integer
          from public.message m
          where m.chat_room_id = room.id
            and m.created_at > coalesce(crm_read.last_read_at, 'epoch'::timestamptz)
            and m.user_id <> p_user_id
        ),
        0
      ) as unread_count,
      count(*) OVER ()::integer as total_count
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    left join public.chat_room_member as crm_read
      on crm_read.chat_room_id = room.id
     and crm_read.user_id = p_user_id
    left join lateral (
      select max(message.created_at) as last_message_at
      from public.message as message
      where message.chat_room_id = room.id
    ) as latest_message on true
    where room.owner_id = p_user_id
      and (v_query is null or room.title ilike '%' || v_query || '%')
    order by
      case when v_sort_option = 'LAST_MESSAGE_DESC' then coalesce(latest_message.last_message_at, room.created_at) end desc nulls last,
      case when v_sort_option = 'CURRENT_MEMBER_DESC' then room.current_member end desc nulls last,
      room.created_at desc,
      room.id desc
    limit p_limit offset p_offset;

  elsif v_tab_type = 'JOINED' then
    return query
    select
      room.id,
      room.title,
      room.description,
      room.max_capacity::integer,
      room.current_member,
      room.owner_id,
      owner.nickname,
      room.created_at,
      coalesce(
        (
          select count(*)::integer
          from public.message m
          where m.chat_room_id = room.id
            and m.created_at > coalesce(member.last_read_at, 'epoch'::timestamptz)
            and m.user_id <> p_user_id
        ),
        0
      ) as unread_count,
      count(*) OVER ()::integer as total_count
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    join public.chat_room_member as member on member.chat_room_id = room.id
    left join lateral (
      select max(message.created_at) as last_message_at
      from public.message as message
      where message.chat_room_id = room.id
    ) as latest_message on true
    where member.user_id = p_user_id
      and member.is_banned = false
      and member.last_joined_at is not null
      and (v_query is null or room.title ilike '%' || v_query || '%')
    order by
      case when v_sort_option = 'LAST_MESSAGE_DESC' then coalesce(latest_message.last_message_at, room.created_at) end desc nulls last,
      case when v_sort_option = 'CURRENT_MEMBER_DESC' then room.current_member end desc nulls last,
      room.created_at desc,
      room.id desc
    limit p_limit offset p_offset;

  elsif v_tab_type = 'NOT_JOINED' then
    return query
    select
      room.id,
      room.title,
      room.description,
      room.max_capacity::integer,
      room.current_member,
      room.owner_id,
      owner.nickname,
      room.created_at,
      0::integer as unread_count,
      count(*) OVER ()::integer as total_count
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    left join public.chat_room_member as member
      on member.chat_room_id = room.id
     and member.user_id = p_user_id
    where room.owner_id <> p_user_id
      and (
        member.user_id is null
        or (member.is_banned = false and member.last_joined_at is null)
      )
      and (v_query is null or room.title ilike '%' || v_query || '%')
    order by
      case when v_sort_option = 'CURRENT_MEMBER_DESC' then room.current_member end desc nulls last,
      room.created_at desc,
      room.id desc
    limit p_limit offset p_offset;
  end if;
end;
$function$;
