"use client";

// 현재 사용자의 채팅방 멤버십과 참여 상태를 조회하는 훅

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { RoomMember } from "@/types/chat-room-member";

type CurrentChatRoomMembership = Pick<RoomMember, "is_banned" | "last_joined_at">;

interface Params {
  roomId: string;
  currentUserId: string;
}

export function useCurrentChatRoomMembership({ roomId, currentUserId }: Params) {
  const supabase = createClient();

  const query = useQuery<CurrentChatRoomMembership | null>({
    queryKey: QUERY_KEYS.chat.membership(roomId, currentUserId),
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

  const membership = query.data ?? null;
  const isKicked = membership?.is_banned ?? false;
  const isJoined = !!membership?.last_joined_at && !membership.is_banned;

  return {
    ...query,
    membership,
    isKicked,
    isJoined,
    membershipFetched: query.isFetched,
  };
}
