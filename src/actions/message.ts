"use server";

// 메시지 전송 RPC를 호출하는 서버 액션

import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { createClient } from "@/lib/supabase/server";
import { messageContentSchema } from "@/lib/zod/message";
import type { AppActionResult } from "@/types/action";
import { isKnownMessageRpcError, resolveMessageRpcErrorCode } from "@/utils/app-message";

interface SendMessageActionInput {
  roomId: string;
  content: string;
}

export async function sendMessageAction({
  roomId,
  content,
}: SendMessageActionInput): Promise<AppActionResult> {
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

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_chat_message", {
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

  return {
    success: true,
  };
}
