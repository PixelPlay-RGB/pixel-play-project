"use client";

// chat_room_member 변경 시 채팅방 관련 쿼리를 무효화하는 훅

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";

interface Params {
  roomId: string;
  currentUserId: string;
}

export function useChatRoomMemberRealtimeInvalidation({ roomId, currentUserId }: Params) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const invalidateChatRoomQueries = () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.chat.member(roomId, currentUserId),
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.members(roomId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts() });
    };

    const channel = supabase
      .channel(`chat-room-member-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_room_member",
          filter: `chat_room_id=eq.${roomId}`,
        },
        () => {
          invalidateChatRoomQueries();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_room",
          filter: `id=eq.${roomId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [supabase, queryClient, roomId, currentUserId]);
}
