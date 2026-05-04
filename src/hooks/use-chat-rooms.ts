"use client";

import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoom, ChatRoomTab } from "@/types/chat-room";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const CHAT_ROOMS_QUERY_KEY = ["chat-rooms"] as const;

const fetchRooms = async (currentUserId: string, tabType: ChatRoomTab): Promise<ChatRoom[]> => {
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

export function useChatRooms(tabType: ChatRoomTab) {
  const { data: currentUser } = useUser();

  return useQuery<ChatRoom[]>({
    queryKey: [...CHAT_ROOMS_QUERY_KEY, currentUser?.id, tabType],
    queryFn: () => fetchRooms(currentUser!.id, tabType),
    enabled: !!currentUser?.id,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });
}
