"use client";

// 채팅방 멤버 상태 변경 Realtime 이벤트를 관리하는 훅
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { RoomMember } from "@/types/chat-room-member";

interface UseChatRoomMemberRealtimeParams {
  roomId: string;
  currentUserId: string;
}

export function useChatRoomMemberRealtime({
  roomId,
  currentUserId,
}: UseChatRoomMemberRealtimeParams) {
  const queryClient = useQueryClient();
  const [isKicked, setIsKicked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsKicked(false);

    if (!roomId || !currentUserId) return;

    let ignore = false;

    const supabase = createClient();

    const checkInitialStatus = async () => {
      const { data, error } = await supabase
        .from("chat_room_member")
        .select("is_banned")
        .eq("chat_room_id", roomId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (!ignore && !error && data?.is_banned) {
        setIsKicked(true);
      }
    };

    checkInitialStatus();

    const invalidateChatRoomQueries = () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.members(roomId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts() });
    };

    const handleMemberChange = (payload: RealtimePostgresChangesPayload<RoomMember>) => {
      invalidateChatRoomQueries();

      if (payload.eventType !== "UPDATE") return;

      const previous = payload.old as Partial<RoomMember>;
      const next = payload.new as RoomMember;
      const wasKicked =
        previous.is_banned === false && next.is_banned === true && next.user_id === currentUserId;

      if (wasKicked) {
        setIsKicked(true);
      }
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
        handleMemberChange,
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
      ignore = true;
      void channel.unsubscribe();
    };
  }, [currentUserId, queryClient, roomId]);

  return { isKicked };
}
