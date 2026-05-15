"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CHAT_ROOM_MOBILE_PAGE_SIZE, CHAT_ROOM_PAGE_SIZE } from "@/constants/chat-room";
import { QUERY_KEYS } from "@/constants/query-keys";
import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatRoomByTabWithUnreadCount,
  ChatRoomSortOption,
  ChatRoomTab,
} from "@/types/chat-room";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * 탭 타입별 채팅방 목록 + 안읽음 개수 (get_rooms_by_tab_count RPC)
 */
const fetchRooms = async (
  currentUserId: string,
  tabType: ChatRoomTab,
  sortOption: ChatRoomSortOption,
  offset: number,
  searchQuery: string,
  isMobile: boolean,
): Promise<ChatRoomByTabWithUnreadCount[]> => {
  const supabase = createClient();
  //TODO: useMobile을 사용해서 상태값 실시간 변경 필요함

  const { data, error } = await supabase.rpc("get_rooms_by_tab_count", {
    p_user_id: currentUserId,
    p_tab_type: tabType,
    p_limit: isMobile ? CHAT_ROOM_MOBILE_PAGE_SIZE : CHAT_ROOM_PAGE_SIZE,
    p_offset: offset,
    p_sort_option: sortOption,
    p_query: searchQuery || undefined,
  });

  if (error) throw error;

  return data ?? [];
};

/**
 * 채팅방 목록 조회 커스텀 훅
 * - 페이지 단위로 limit/offset 기반 페이지네이션을 수행한다.
 * - searchQuery가 있으면 현재 탭 내에서 채팅방 제목으로 필터링한다.
 */
export function useChatRooms(
  tabType: ChatRoomTab,
  sortOption: ChatRoomSortOption,
  currentPage: number,
  searchQuery: string,
) {
  const { data: currentUser, isFetched: isUserFetched } = useUser();
  const isMobile = useIsMobile();
  const offset = (currentPage - 1) * (isMobile ? CHAT_ROOM_MOBILE_PAGE_SIZE : CHAT_ROOM_PAGE_SIZE);
  const trimmedQuery = searchQuery.trim();
  const queryParam = trimmedQuery || undefined; // 빈 문자열은 캐시 키에서 제거 → 검색 없는 상태와 동일 키

  return useQuery<ChatRoomByTabWithUnreadCount[]>({
    queryKey: QUERY_KEYS.chat.rooms(currentUser?.id, tabType, sortOption, currentPage, queryParam),
    queryFn: () => fetchRooms(currentUser!.id, tabType, sortOption, offset, trimmedQuery, isMobile),
    enabled: !!currentUser?.id && isUserFetched,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });
}
