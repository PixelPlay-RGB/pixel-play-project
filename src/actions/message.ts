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
      photoUrl: actor.result.photoUrl,
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("send_chat_message", {
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

  const { data: messageRow, error: rowError } = await supabase
    .from("message")
    .select("*, user:user_id!inner(nickname, photo_url)")
    .eq("chat_room_id", roomId)
    .eq("user_id", actor.userId)
    .eq("content", parsed.data)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rowError || !messageRow) {
    console.error("전송 직후 메시지 조회 실패", rowError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.message.sendFailed,
    };
  }

  return {
    success: true,
    data: { message: messageRow as MessageQuery },
  };
}
