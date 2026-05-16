"use server";

// 채팅방 멤버 관리 RPC를 호출하는 서버 액션
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/action";
import { resolveRpcErrorCode } from "@/utils/app-message";

interface ChatRoomMemberActionInput {
  roomId: string;
  targetUserId: string;
}

export async function kickChatRoomMemberAction({
  roomId,
  targetUserId,
}: ChatRoomMemberActionInput): Promise<AppActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("kick_chat_room_member", {
    p_room_id: roomId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    console.error("채팅방 참여자 강퇴 RPC 실패", error);
    return {
      success: false,
      code: resolveRpcErrorCode(error, APP_MESSAGE_CODE.error.chatRoomMember.kickFailed),
    };
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.chatRoomMember.kicked,
  };
}

export async function transferChatRoomOwnerAction({
  roomId,
  targetUserId,
}: ChatRoomMemberActionInput): Promise<AppActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("transfer_chat_room_owner", {
    p_room_id: roomId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    console.error("채팅방 방장 위임 RPC 실패", error);
    return {
      success: false,
      code: resolveRpcErrorCode(error, APP_MESSAGE_CODE.error.chatRoomMember.transferFailed),
    };
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.chatRoomMember.ownerTransferred,
  };
}
