"use client";

import { QUERY_KEYS } from "@/constants/query-keys";
import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoomByTab, ChatRoomTab } from "@/types/chat-room";
import { useQuery } from "@tanstack/react-query";

export const CHAT_ROOM_PAGE_SIZE = 30;

const fetchChatrooms = async (
  currentUserId: string,
  tabType: ChatRoomTab,
): Promise<ChatRoomByTab[]> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_rooms_by_tab", {
    p_user_id: currentUserId,
    p_tab_type: tabType,
  });

  if (error) throw error;

  return data ?? [];
};

/**
 * 채팅방 목록 조회 커스텀 훅.
 * - 현재는 전체 목록 선패칭 후 클라이언트 표시 개수만 늘리는 방식이다.
 *   (UI만 무한스크롤이며 서버 페이지 단위 로딩이 아님)
 * - 서버 페이지네이션은 get_rooms_by_tab RPC에 limit/offset 파라미터 추가가 필요하다.
 * - 유저 프로필 정보가 로드된 후에만 목록을 패칭하도록 안전장치를 추가했습니다.
 */
export function useChatRooms(tabType: ChatRoomTab) {
  const { data: currentUser, isFetched: isUserFetched } = useUser();

  return useQuery<ChatRoomByTab[]>({
    queryKey: QUERY_KEYS.chat.rooms(currentUser?.id, tabType),
    queryFn: () => fetchChatrooms(currentUser!.id, tabType),
    enabled: !!currentUser?.id && isUserFetched,
    refetchOnMount: "always",
  });
}
