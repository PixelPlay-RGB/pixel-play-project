"use client";

import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoomByTab, ChatRoomTab } from "@/types/chat-room";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";

/**
 * 탭 타입별 채팅방 목록을 가져오는 함수
 */
const fetchRooms = async (
  currentUserId: string,
  tabType: ChatRoomTab,
): Promise<ChatRoomByTab[]> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_rooms_by_tab", {
    p_user_id: currentUserId,
    p_tab_type: tabType,
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
export function useChatRooms(tabType: ChatRoomTab) {
  const { data: currentUser, isFetched: isUserFetched } = useUser();

  return useQuery<ChatRoomByTab[]>({
    queryKey: QUERY_KEYS.chat.rooms(currentUser?.id, tabType),
    queryFn: () => fetchRooms(currentUser!.id, tabType),
    // 유저 정보가 확실히 로드된 후에만 채팅방 페칭 시작
    enabled: !!currentUser?.id && isUserFetched,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });
}
