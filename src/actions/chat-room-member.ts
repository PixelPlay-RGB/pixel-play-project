"use server";

// 채팅방 멤버 관리 RPC를 호출하는 서버 액션
import { createClient } from "@/lib/supabase/server";

interface ChatRoomMemberActionInput {
  roomId: string;
  targetUserId: string;
}

interface ChatRoomMemberActionResult {
  success: boolean;
  message?: string;
}

export async function kickChatRoomMemberAction({
  roomId,
  targetUserId,
}: ChatRoomMemberActionInput): Promise<ChatRoomMemberActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("kick_chat_room_member", {
    p_room_id: roomId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    return {
      success: false,
      message: "강퇴 처리에 실패했습니다.",
    };
  }

  return { success: true };
}

export async function transferChatRoomOwnerAction({
  roomId,
  targetUserId,
}: ChatRoomMemberActionInput): Promise<ChatRoomMemberActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("transfer_chat_room_owner", {
    p_room_id: roomId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    return {
      success: false,
      message: "방장 권한 위임에 실패했습니다.",
    };
  }

  return { success: true };
}
