-- 채팅방 상세 화면에서 방 정보, 현재 유저 멤버십, active 멤버 목록을 한 번에 조회한다.

create or replace function public.get_chat_room_detail(p_room_id uuid)
returns table(
  room jsonb,
  membership jsonb,
  members jsonb
)
language plpgsql
security invoker
stable
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  return query
  with target_room as (
    select
      chat_room.id,
      chat_room.owner_id,
      chat_room.title,
      chat_room.description,
      chat_room.max_capacity::integer as max_capacity,
      chat_room.current_member::integer as current_member,
      chat_room.created_at,
      chat_room.modified_at
    from public.chat_room
    where chat_room.id = p_room_id
  ),
  room_payload as (
    select jsonb_build_object(
      'id', target_room.id,
      'owner_id', target_room.owner_id,
      'title', target_room.title,
      'description', target_room.description,
      'max_capacity', target_room.max_capacity,
      'current_member', target_room.current_member,
      'created_at', target_room.created_at,
      'modified_at', target_room.modified_at
    ) as payload
    from target_room
  ),
  membership_payload as (
    select jsonb_build_object(
      'id', member.id,
      'user_id', member.user_id,
      'chat_room_id', member.chat_room_id,
      'last_joined_at', member.last_joined_at,
      'last_read_at', member.last_read_at,
      'created_at', member.created_at,
      'is_banned', member.is_banned
    ) as payload
    from public.chat_room_member as member
    where member.chat_room_id = p_room_id
      and member.user_id = v_user_id
    limit 1
  ),
  members_payload as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', member.id,
          'user_id', member.user_id,
          'chat_room_id', member.chat_room_id,
          'last_joined_at', member.last_joined_at,
          'last_read_at', member.last_read_at,
          'created_at', member.created_at,
          'is_banned', member.is_banned,
          'user', jsonb_build_object(
            'nickname', profile.nickname,
            'photo_url', profile.photo_url
          )
        )
        order by
          case when member.user_id = target_room.owner_id then 0 else 1 end,
          member.created_at asc,
          member.id asc
      ),
      '[]'::jsonb
    ) as payload
    from public.chat_room_member as member
    join public."user" as profile on profile.id = member.user_id
    join target_room on target_room.id = member.chat_room_id
    where member.chat_room_id = p_room_id
      and member.is_banned = false
      and member.last_joined_at is not null
  )
  select
    (select room_payload.payload from room_payload) as room,
    (select membership_payload.payload from membership_payload) as membership,
    (select members_payload.payload from members_payload) as members;
end;
$function$;

revoke execute on function public.get_chat_room_detail(uuid) from public;
revoke execute on function public.get_chat_room_detail(uuid) from anon;
grant execute on function public.get_chat_room_detail(uuid) to authenticated;
