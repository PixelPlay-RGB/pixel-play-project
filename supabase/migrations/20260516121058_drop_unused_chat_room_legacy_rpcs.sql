-- 채팅방 목록 통합 RPC 도입 이후 소스에서 더 이상 호출하지 않는 구형 RPC를 제거한다.

drop function if exists public.get_room_counts_by_user(uuid);
drop function if exists public.get_rooms_by_tab_count(uuid, text, text, integer, integer, text);
