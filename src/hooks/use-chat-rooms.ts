"use client";

import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoomByTabWithUnreadCount, ChatRoomByTab, ChatRoomSortOption, ChatRoomTab } from "@/types/chat-room";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";

/**
 * 탭 타입별 채팅방 목록 + 안읽음 개수 (get_rooms_by_tab_count RPC)
 */
const fetchRooms = async (
  currentUserId: string,
  tabType: ChatRoomTab,
  sortOption: ChatRoomSortOption,
): Promise<ChatRoomByTabWithUnreadCount[]> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_rooms_by_tab_count", {
    p_user_id: currentUserId,
    p_tab_type: tabType,
    p_sort_option: sortOption,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
};

/**
 * 채팅방 목록 조회 커스텀 훅
 * - 유저 프로필 정보가 로드된 후에만 목록을 페칭하도록 안전장치를 추가했습니다.
 */
export function useChatRooms(tabType: ChatRoomTab, sortOption: ChatRoomSortOption) {
  const { data: currentUser, isFetched: isUserFetched } = useUser();

  return useQuery<ChatRoomByTabWithUnreadCount[]>({
    queryKey: QUERY_KEYS.chat.rooms(currentUser?.id, tabType, sortOption),
    queryFn: () => fetchRooms(currentUser!.id, tabType, sortOption),
    // 유저 정보가 확실히 로드된 후에만 채팅방 페칭 시작
    enabled: !!currentUser?.id && isUserFetched,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });
}
