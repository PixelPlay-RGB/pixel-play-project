"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { ChatRoom } from "@/types/chat-room";

export function useRoom(roomId: string) {
  const supabase = createClient();

  return useQuery<ChatRoom>({
    queryKey: QUERY_KEYS.chat.room(roomId),
    enabled: !!roomId,
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
