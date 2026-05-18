"use server";
// 메시지 전송 RPC를 호출하는 서버 액션

import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { getAuthenticatedActorId } from "@/actions/authenticated-actor";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { messageContentSchema } from "@/lib/zod/message";
import type { AppActionResult } from "@/types/action";
import type { MessageQuery } from "@/types/message";
import { isKnownMessageRpcError, resolveMessageRpcErrorCode } from "@/utils/app-message";

interface SendMessageActionInput {
  roomId: string;
  content: string;
}

export async function sendMessageAction({
  roomId,
  content,
}: SendMessageActionInput): Promise<AppActionResult<{ message: MessageQuery }>> {
  if (!roomId) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.chatRoom.missingRoomId,
    };
  }

  const parsed = messageContentSchema.safeParse(content);

  if (!parsed.success) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.message.invalidInput,
    };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "메시지 전송 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return {
      success: false,
      code: actor.result.code,
    };
  }

  const supabase = createAdminClient();
  const { data: messageId, error } = await supabase.rpc("send_chat_message", {
    p_actor_user_id: actor.userId,
    p_room_id: roomId,
    p_content: parsed.data,
  });

  if (error) {
    if (!isKnownMessageRpcError(error)) {
      console.error("메시지 전송 RPC 실패", error);
    }

    return {
      success: false,
      code: resolveMessageRpcErrorCode(error, APP_MESSAGE_CODE.error.message.sendFailed),
    };
  }

  if (!messageId) {
    console.error("메시지 전송 RPC가 생성 메시지 id를 반환하지 않음");
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.message.sendFailed,
    };
  }

  const { data: message, error: messageError } = await supabase
    .from("message")
    .select("*, user:user_id!inner(nickname, photo_url)")
    .eq("id", messageId)
    .single();

  if (messageError || !message) {
    console.error("전송 메시지 조회 실패", messageError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.message.sendFailed,
    };
  }

  return {
    success: true,
    data: {
      message,
    },
  };
}
