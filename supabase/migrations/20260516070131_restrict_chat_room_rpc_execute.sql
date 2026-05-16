-- 채팅방 변경성 RPC와 트리거 전용 함수의 직접 실행 권한을 제한한다.

revoke execute on function public.join_chat_room(uuid) from public;
revoke execute on function public.leave_chat_room(uuid) from public;
revoke execute on function public.mark_room_read(uuid) from public;
revoke execute on function public.kick_chat_room_member(uuid, uuid) from public;
revoke execute on function public.transfer_chat_room_owner(uuid, uuid) from public;

revoke execute on function public.join_chat_room(uuid) from anon;
revoke execute on function public.leave_chat_room(uuid) from anon;
revoke execute on function public.mark_room_read(uuid) from anon;
revoke execute on function public.kick_chat_room_member(uuid, uuid) from anon;
revoke execute on function public.transfer_chat_room_owner(uuid, uuid) from anon;

grant execute on function public.join_chat_room(uuid) to authenticated;
grant execute on function public.leave_chat_room(uuid) to authenticated;
grant execute on function public.mark_room_read(uuid) to authenticated;
grant execute on function public.kick_chat_room_member(uuid, uuid) to authenticated;
grant execute on function public.transfer_chat_room_owner(uuid, uuid) to authenticated;

revoke execute on function public.delete_empty_chat_room() from public;
revoke execute on function public.insert_chat_room_member_system_message() from public;
revoke execute on function public.insert_date_divider_message() from public;

revoke execute on function public.delete_empty_chat_room() from anon;
revoke execute on function public.insert_chat_room_member_system_message() from anon;
revoke execute on function public.insert_date_divider_message() from anon;

revoke execute on function public.delete_empty_chat_room() from authenticated;
revoke execute on function public.insert_chat_room_member_system_message() from authenticated;
revoke execute on function public.insert_date_divider_message() from authenticated;
