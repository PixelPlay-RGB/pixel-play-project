"use client";

// 채팅방 멤버 상태(참여/강퇴)를 본인 row 단건 조회 + Realtime 구독으로 관리하는 훅

import { useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";

interface UseChatRoomMemberRealtimeParams {
  roomId: string;
  currentUserId: string;
}

export function useChatRoomMemberRealtime({
  roomId,
  currentUserId,
}: UseChatRoomMemberRealtimeParams) {
  const queryClient = useQueryClient();

  // supabase는 공식문서에도 나와있음 이렇게 사용하면 싱글톤 패턴으로 등록됨 전혀 고려할 문제없음
  const supabase = createClient();

  const { data: membership, isFetched: membershipFetched } = useQuery({
    queryKey: [...QUERY_KEYS.chat.members(roomId), currentUserId],
    enabled: !!roomId && !!currentUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_room_member")
        .select("is_banned, last_joined_at")
        .eq("chat_room_id", roomId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isKicked = membership?.is_banned ?? false;
  const isJoined = !!membership?.last_joined_at && !membership.is_banned;

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const invalidateChatRoomQueries = () => {
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

  return { isKicked, isJoined, membershipFetched };
}
