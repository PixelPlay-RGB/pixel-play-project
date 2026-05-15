"use client";

// 현재 사용자의 chat_room_member 행과 참여 상태를 조회하는 훅

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { RoomMember } from "@/types/chat-room-member";

type CurrentChatRoomMemberRow = Pick<RoomMember, "is_banned" | "last_joined_at">;

interface Params {
  roomId: string;
  currentUserId: string;
}

export function useCurrentChatRoomMemberRow({ roomId, currentUserId }: Params) {
  const supabase = createClient();

  const query = useQuery<CurrentChatRoomMemberRow | null>({
    queryKey: QUERY_KEYS.chat.member(roomId, currentUserId),
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

  const currentChatRoomMemberRow = query.data ?? null;
  const isKicked = currentChatRoomMemberRow?.is_banned ?? false;
  const isJoined =
    !!currentChatRoomMemberRow?.last_joined_at && !currentChatRoomMemberRow.is_banned;

  return {
    ...query,
    currentChatRoomMemberRow,
    isKicked,
    isJoined,
    membershipFetched: query.isFetched,
  };
}
