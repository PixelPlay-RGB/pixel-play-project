"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoomByTab, ChatRoomTab } from "@/types/chat-room";

export const CHAT_ROOM_PAGE_SIZE = 30;

const fetchChatrooms = async (
  currentUserId: string,
  tabType: ChatRoomTab,
  offset: number,
): Promise<ChatRoomByTab[]> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_rooms_by_tab", {
    p_user_id: currentUserId,
    p_tab_type: tabType,
    p_limit: CHAT_ROOM_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) throw error;

  return data ?? [];
};

export function useChatRooms(tabType: ChatRoomTab) {
  const { data: currentUser, isFetched: isUserFetched } = useUser();

  return useInfiniteQuery<ChatRoomByTab[]>({
    queryKey: QUERY_KEYS.chat.rooms(currentUser?.id, tabType),
    queryFn: ({ pageParam }) =>
      fetchChatrooms(currentUser!.id, tabType, Number(pageParam)),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === CHAT_ROOM_PAGE_SIZE
        ? allPages.length * CHAT_ROOM_PAGE_SIZE
        : undefined,
    enabled: !!currentUser?.id && isUserFetched,
    refetchOnMount: "always",
  });
}
