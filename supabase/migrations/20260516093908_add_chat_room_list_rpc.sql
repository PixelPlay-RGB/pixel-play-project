-- 홈 채팅방 목록에서 rooms와 counts를 한 번에 조회하는 RPC를 추가한다.
-- 빈 검색 결과에서도 탭 count를 유지해야 하므로 rows 배열과 count 메타데이터를 한 행으로 반환한다.

drop function if exists public.get_chat_room_list(uuid, text, text, integer, integer, text);
drop function if exists public.get_chat_room_list(text, text, integer, integer, text);

create function public.get_chat_room_list(
  p_tab_type text,
  p_sort_option text default 'CREATED_AT_DESC',
  p_limit integer default 30,
  p_offset integer default 0,
  p_query text default null
)
returns table(
  rooms jsonb,
  total_count integer,
  joined_count integer,
  not_joined_count integer,
  owned_count integer
)
language plpgsql
security invoker
stable
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tab_type text := upper(coalesce(p_tab_type, ''));
  v_sort_option text := upper(coalesce(p_sort_option, 'CREATED_AT_DESC'));
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_limit integer := greatest(coalesce(p_limit, 30), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if v_user_id is null then
    raise exception 'get_chat_room_list requires an authenticated user';
  end if;

  if v_sort_option not in ('CREATED_AT_DESC', 'LAST_MESSAGE_DESC', 'CURRENT_MEMBER_DESC') then
    v_sort_option := 'CREATED_AT_DESC';
  end if;

  if v_tab_type = 'NOT_JOINED' and v_sort_option = 'LAST_MESSAGE_DESC' then
    v_sort_option := 'CREATED_AT_DESC';
  end if;

  return query
  with base_rooms as (
    select
      room.id,
      room.title,
      room.description,
      room.max_capacity::integer as max_capacity,
      room.current_member::integer as current_member,
      room.owner_id,
      owner_profile.nickname as owner_nickname,
      room.created_at,
      member.user_id as member_user_id,
      member.is_banned,
      member.last_joined_at,
      member.last_read_at,
      latest_message.last_message_at
    from public.chat_room as room
    join public."user" as owner_profile on owner_profile.id = room.owner_id
    left join public.chat_room_member as member
      on member.chat_room_id = room.id
     and member.user_id = v_user_id
    left join lateral (
      select max(message.created_at) as last_message_at
      from public.message as message
      where message.chat_room_id = room.id
        and message.message_type = 'text'
    ) as latest_message on true
  ),
  tab_counts as (
    select
      count(*) filter (
        where member_user_id = v_user_id
          and is_banned = false
          and last_joined_at is not null
      )::integer as joined_count,
      count(*) filter (
        where owner_id <> v_user_id
          and (
            member_user_id is null
            or (is_banned = false and last_joined_at is null)
          )
          and current_member < max_capacity
      )::integer as not_joined_count,
      count(*) filter (
        where owner_id = v_user_id
      )::integer as owned_count
    from base_rooms
  ),
  filtered_rooms as (
    select
      base_rooms.id,
      base_rooms.title,
      base_rooms.description,
      base_rooms.max_capacity,
      base_rooms.current_member,
      base_rooms.owner_id,
      base_rooms.owner_nickname,
      base_rooms.created_at,
      base_rooms.last_message_at,
      case
        when v_tab_type = 'NOT_JOINED' then 0
        else coalesce(
          (
            select count(*)::integer
            from public.message as message
            where message.chat_room_id = base_rooms.id
              and message.created_at > coalesce(base_rooms.last_read_at, 'epoch'::timestamptz)
              and message.user_id <> v_user_id
              and message.message_type = 'text'
          ),
          0
        )
      end as unread_count
    from base_rooms
    where (
      (
        v_tab_type = 'OWNED'
        and base_rooms.owner_id = v_user_id
      )
      or (
        v_tab_type = 'JOINED'
        and base_rooms.member_user_id = v_user_id
        and base_rooms.is_banned = false
        and base_rooms.last_joined_at is not null
      )
      or (
        v_tab_type = 'NOT_JOINED'
        and base_rooms.owner_id <> v_user_id
        and (
          base_rooms.member_user_id is null
          or (base_rooms.is_banned = false and base_rooms.last_joined_at is null)
        )
        and base_rooms.current_member < base_rooms.max_capacity
      )
    )
      and (v_query is null or base_rooms.title ilike '%' || v_query || '%')
  ),
  paginated_rooms as (
    select *
    from filtered_rooms
    order by
      case when v_sort_option = 'LAST_MESSAGE_DESC' then coalesce(last_message_at, created_at) end desc nulls last,
      case when v_sort_option = 'CURRENT_MEMBER_DESC' then current_member end desc nulls last,
      created_at desc,
      id desc
    limit v_limit offset v_offset
  ),
  rooms_payload as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'description', description,
          'max_capacity', max_capacity,
          'current_member', current_member,
          'owner_id', owner_id,
          'owner_nickname', owner_nickname,
          'created_at', created_at,
          'unread_count', unread_count
        )
        order by
          case when v_sort_option = 'LAST_MESSAGE_DESC' then coalesce(last_message_at, created_at) end desc nulls last,
          case when v_sort_option = 'CURRENT_MEMBER_DESC' then current_member end desc nulls last,
          created_at desc,
          id desc
      ),
      '[]'::jsonb
    ) as rooms
    from paginated_rooms
  ),
  total as (
    select count(*)::integer as total_count
    from filtered_rooms
  )
  select
    rooms_payload.rooms,
    total.total_count,
    tab_counts.joined_count,
    tab_counts.not_joined_count,
    tab_counts.owned_count
  from rooms_payload
  cross join total
  cross join tab_counts;
end;
$function$;

revoke execute on function public.get_chat_room_list(text, text, integer, integer, text) from public;
revoke execute on function public.get_chat_room_list(text, text, integer, integer, text) from anon;
grant execute on function public.get_chat_room_list(text, text, integer, integer, text) to authenticated;
