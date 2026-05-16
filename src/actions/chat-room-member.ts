"use server";

// 채팅방 멤버십과 멤버 관리 RPC를 호출하는 서버 액션
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import type { AppMessageCode } from "@/constants/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/action";
import { isKnownChatRoomRpcError, resolveChatRoomRpcErrorCode } from "@/utils/app-message";
import { isAuthSessionMissingError } from "@/utils/auth-error";

interface ChatRoomMemberActionInput {
  roomId: string;
  targetUserId: string;
}

type AuthenticatedActorResult =
  | {
      success: true;
      userId: string;
    }
  | {
      success: false;
      result: AppActionResult;
    };

function createRpcFailureResult(
  error: unknown,
  fallbackCode: AppMessageCode,
  logLabel: string,
): AppActionResult {
  if (!isKnownChatRoomRpcError(error)) {
    console.error(logLabel, error);
  }

  return {
    success: false,
    code: resolveChatRoomRpcErrorCode(error, fallbackCode),
  };
}

async function getAuthenticatedActorId(): Promise<AuthenticatedActorResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && !isAuthSessionMissingError(error)) {
    console.error("채팅방 참여자 관리 중 인증 유저 조회 실패", error);
  }

  if (!user) {
    return {
      success: false,
      result: {
        success: false,
        code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
      },
    };
  }

  return {
    success: true,
    userId: user.id,
  };
}

export async function joinChatRoomAction(roomId: string): Promise<AppActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("join_chat_room", {
    p_room_id: roomId,
  });

  if (error) {
    return createRpcFailureResult(
      error,
      APP_MESSAGE_CODE.error.chatRoom.joinFailed,
      "채팅방 참여 RPC 실패",
    );
  }

  return {
    success: true,
  };
}

export async function leaveChatRoomAction(roomId: string): Promise<AppActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("leave_chat_room", {
    p_room_id: roomId,
  });

  if (error) {
    return createRpcFailureResult(
      error,
      APP_MESSAGE_CODE.error.chatRoom.leaveFailed,
      "채팅방 나가기 RPC 실패",
    );
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.chatRoom.left,
  };
}

export async function markRoomReadAction(roomId: string): Promise<AppActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_room_read", {
    p_room_id: roomId,
  });

  if (error) {
    return createRpcFailureResult(
      error,
      APP_MESSAGE_CODE.error.chatRoom.notActiveMember,
      "채팅방 읽음 처리 RPC 실패",
    );
  }

  return {
    success: true,
  };
}

export async function kickChatRoomMemberAction({
  roomId,
  targetUserId,
}: ChatRoomMemberActionInput): Promise<AppActionResult> {
  const actor = await getAuthenticatedActorId();

  if (!actor.success) {
    return actor.result;
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("kick_chat_room_member", {
    p_actor_user_id: actor.userId,
    p_room_id: roomId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    return createRpcFailureResult(
      error,
      APP_MESSAGE_CODE.error.chatRoomMember.kickFailed,
      "채팅방 참여자 강퇴 RPC 실패",
    );
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
  const actor = await getAuthenticatedActorId();

  if (!actor.success) {
    return actor.result;
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("transfer_chat_room_owner", {
    p_actor_user_id: actor.userId,
    p_room_id: roomId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    return createRpcFailureResult(
      error,
      APP_MESSAGE_CODE.error.chatRoomMember.transferFailed,
      "채팅방 방장 위임 RPC 실패",
    );
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.chatRoomMember.ownerTransferred,
  };
}
