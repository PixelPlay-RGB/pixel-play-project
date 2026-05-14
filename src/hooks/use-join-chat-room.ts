"use client";

// join_chat_room RPC 호출 후 채팅방 멤버·룸 관련 쿼리를 무효화하는 mutation 훅

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";

export function useJoinChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("join_chat_room", { p_room_id: roomId });
      if (error) throw error;
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.members(roomId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
    },
  });
}
