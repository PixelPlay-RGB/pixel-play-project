"use client";
// 채팅방 기본 정보를 조회하는 훅

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { ChatRoom } from "@/types/chat-room";

interface UseRoomOptions {
  initialData?: ChatRoom;
}

export function useRoom(roomId: string, options?: UseRoomOptions) {
  const supabase = createClient();

  return useQuery<ChatRoom>({
    queryKey: QUERY_KEYS.chat.room(roomId),
    enabled: !!roomId,
    initialData: options?.initialData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_room")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) throw error;

      return data;
    },
  });
}
