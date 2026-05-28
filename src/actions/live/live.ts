"use server";
// 라이브 채팅 메시지 전송 RPC를 호출하는 서버 액션입니다.

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";

export async function sendLiveMessageAction(
  broadcastId: string,
  content: string,
): Promise<AppActionResult<{ messageId: string }>> {
  const trimmed = content.trim();

  if (!trimmed || trimmed.length > 200) {
    return { success: false, code: APP_MESSAGE_CODE.error.message.invalidInput };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 채팅 전송 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data: messageId, error } = await supabase.rpc("send_live_message", {
    p_actor_user_id: actor.userId,
    p_broadcast_id: broadcastId,
    p_content: trimmed,
  });

  if (error) {
    console.error("라이브 채팅 전송 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.message.sendFailed };
  }

  if (!messageId) {
    console.error("라이브 채팅 전송 RPC가 messageId를 반환하지 않음");
    return { success: false, code: APP_MESSAGE_CODE.error.message.sendFailed };
  }

  return { success: true, data: { messageId } };
}
