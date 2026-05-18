-- 공유 링크 preview와 OG metadata에 필요한 최소 채팅방 정보를 공개합니다.
create or replace function public.get_public_chat_room_metadata(p_room_id uuid)
returns table (
  id uuid,
  title text,
  description text
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    room.id,
    room.title,
    coalesce(room.description, '') as description
  from public.chat_room as room
  where room.id = p_room_id
  limit 1;
$$;

revoke execute on function public.get_public_chat_room_metadata(uuid) from public;
grant execute on function public.get_public_chat_room_metadata(uuid) to anon;
grant execute on function public.get_public_chat_room_metadata(uuid) to authenticated;
grant execute on function public.get_public_chat_room_metadata(uuid) to service_role;
