"use client";
// 채팅방 상세 관련 realtime 변경 시 상세와 목록 쿼리를 무효화하는 훅

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";

interface Params {
  roomId: string;
  currentUserId: string;
}

export function useChatRoomDetailRealtimeInvalidation({ roomId, currentUserId }: Params) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const invalidateChatRoomQueries = () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.detail(roomId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.list() });
    };

    const channel = supabase
      .channel(`chat-room-detail-${roomId}`)
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
          invalidateChatRoomQueries();
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [supabase, queryClient, roomId, currentUserId]);
}
