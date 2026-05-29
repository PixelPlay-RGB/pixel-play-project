"use server";
// 라이브 채팅 메시지와 채팅 규칙 동의 RPC를 호출하는 서버 액션입니다.

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";
import { isKnownMessageRpcError, resolveMessageRpcErrorCode } from "@/utils/common/app-message";

export async function sendLiveMessageAction(
  broadcastId: string,
  content: string,
): Promise<AppActionResult<{ messageId: string }>> {
  const trimmed = content.trim();

  if (!broadcastId) {
    return { success: false, code: APP_MESSAGE_CODE.error.message.invalidInput };
  }

  if (!trimmed || trimmed.length > 200) {
    return { success: false, code: APP_MESSAGE_CODE.error.message.invalidInput };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 채팅 전송 중 인증 사용자 조회 실패",
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
    if (!isKnownMessageRpcError(error)) {
      console.error("라이브 채팅 전송 RPC 실패", error);
    }

    return {
      success: false,
      code: resolveMessageRpcErrorCode(error, APP_MESSAGE_CODE.error.message.sendFailed),
    };
  }

  if (!messageId) {
    console.error("라이브 채팅 전송 RPC가 messageId를 반환하지 않음");
    return { success: false, code: APP_MESSAGE_CODE.error.message.sendFailed };
  }

  return { success: true, data: { messageId } };
}

export async function acceptLiveChatRuleAction(
  creatorId: string,
): Promise<AppActionResult<{ acceptedVersion: number }>> {
  if (!creatorId) {
    return { success: false, code: APP_MESSAGE_CODE.error.message.invalidInput };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 채팅 규칙 동의 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data: acceptedVersion, error } = await supabase.rpc("accept_live_chat_rule", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
  });

  if (error) {
    console.error("라이브 채팅 규칙 동의 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  if (typeof acceptedVersion !== "number") {
    console.error("라이브 채팅 규칙 동의 RPC가 버전을 반환하지 않음");
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return {
    success: true,
    data: { acceptedVersion },
  };
}
