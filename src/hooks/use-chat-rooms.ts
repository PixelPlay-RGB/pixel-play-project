import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CHAT_ROOM_PAGE_SIZE } from "@/constants/chat-room";
import { QUERY_KEYS } from "@/constants/query-keys";
import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatRoomByTabWithUnreadCount,
  ChatRoomSortOption,
  ChatRoomTab,
} from "@/types/chat-room";

/**
 * 탭 타입별 채팅방 목록 + 안읽음 개수 (get_rooms_by_tab_count RPC)
 */
const fetchRooms = async (
  currentUserId: string,
  tabType: ChatRoomTab,
  sortOption: ChatRoomSortOption,
  offset: number,
): Promise<ChatRoomByTabWithUnreadCount[]> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_rooms_by_tab_count", {
    p_user_id: currentUserId,
    p_tab_type: tabType,
    p_limit: CHAT_ROOM_PAGE_SIZE,
    p_offset: offset,
    p_sort_option: sortOption,
  });

  if (error) throw error;

  return data ?? [];
};

/**
 * 채팅방 목록 조회 커스텀 훅
 * - 페이지 단위로 limit/offset 기반 페이지네이션을 수행한다.
 */
export function useChatRooms(
  tabType: ChatRoomTab,
  sortOption: ChatRoomSortOption,
  currentPage: number,
) {
  const { data: currentUser, isFetched: isUserFetched } = useUser();
  const offset = (currentPage - 1) * CHAT_ROOM_PAGE_SIZE;

  return useQuery<ChatRoomByTabWithUnreadCount[]>({
    queryKey: QUERY_KEYS.chat.rooms(currentUser?.id, tabType, sortOption, currentPage),
    queryFn: () => fetchRooms(currentUser!.id, tabType, sortOption, offset),
    enabled: !!currentUser?.id && isUserFetched,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });
}
