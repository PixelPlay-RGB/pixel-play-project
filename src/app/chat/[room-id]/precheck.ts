// 채팅방 상세 진입 전 서버 읽기 전용 사전 조회를 담당합니다.

import { createClient } from "@/lib/supabase/server";
import type {
  ChatRoomEntryMembership,
  ChatRoomPrecheckResult,
  InitialEntryStatus,
} from "@/types/chat-room-entry";

function deriveEntryStatus(membership: ChatRoomEntryMembership | null): InitialEntryStatus {
  if (!membership) return "new";
  if (membership.is_banned) return "banned";
  if (membership.last_joined_at === null) return "left";
  return "active";
}

export async function getChatRoomPrecheck(roomId: string): Promise<ChatRoomPrecheckResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data: room, error: roomError } = await supabase
    .from("chat_room")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (roomError || !room) {
    return { status: "not_found" };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("chat_room_member")
    .select("is_banned, last_joined_at")
    .eq("chat_room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    status: "ready",
    initialView: {
      room,
      entryStatus: membershipError ? undefined : deriveEntryStatus(membership),
      entryMembership: membershipError ? undefined : membership,
      userId: user.id,
    },
  };
}
