"use server";
// 라이브 채팅 메시지와 채팅 규칙 동의 RPC를 호출하는 서버 액션입니다.

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createWriteClientForAction } from "@/actions/common/admin-client-action";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import {
  LIVE_CHAT_MESSAGE_MAX_LENGTH,
  LIVE_DONATION_MESSAGE_MAX_LENGTH,
} from "@/constants/live/live";
import type { AppActionResult } from "@/types/common/action";
import type { SendLiveMessageResult } from "@/types/live/live";
import {
  isKnownDonationRpcError,
  isKnownMessageRpcError,
  resolveDonationRpcErrorCode,
  resolveMessageRpcErrorCode,
} from "@/utils/common/app-message";
import { isRecord } from "@/utils/common/json";
import { isUuid } from "@/utils/common/uuid";

// send_live_message_v2의 jsonb 응답({ messageId, moderated })을 앱 타입으로 정규화한다.
// 금칙어로 가려진 경우 messageId는 null, moderated는 true다.
function normalizeSendLiveMessageResult(data: unknown): SendLiveMessageResult | null {
  if (!isRecord(data)) return null;

  const moderated = data.moderated;
  const messageId = data.messageId;

  if (typeof moderated !== "boolean") return null;
  if (messageId !== null && typeof messageId !== "string") return null;
  // 정상 전송인데 messageId가 없으면 RPC 응답이 깨진 것이다.
  if (!moderated && !messageId) return null;

  return { messageId: messageId ?? null, moderated };
}

export async function sendLiveMessageAction(
  broadcastId: string,
  content: string,
): Promise<AppActionResult<SendLiveMessageResult>> {
  const trimmed = content.trim();

  if (!broadcastId || !isUuid(broadcastId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  if (!trimmed || trimmed.length > LIVE_CHAT_MESSAGE_MAX_LENGTH) {
    return { success: false, code: APP_MESSAGE_CODE.error.message.invalidInput };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 채팅 전송 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const client = await createWriteClientForAction<SendLiveMessageResult>(
    "라이브 채팅 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.message.sendFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { data, error } = await client.supabase.rpc("send_live_message_v2", {
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

  const result = normalizeSendLiveMessageResult(data);

  if (!result) {
    console.error("라이브 채팅 전송 RPC 응답 형식 오류", data);
    return { success: false, code: APP_MESSAGE_CODE.error.message.sendFailed };
  }

  return { success: true, data: result };
}

export async function voteLivePollAction(pollId: string, optionId: string): Promise<boolean> {
  const trimmedOptionId = optionId.trim();

  if (!pollId || !isUuid(pollId) || !trimmedOptionId) return false;

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 투표 중 인증 사용자 조회 실패",
  });

  if (!actor.success) return false;

  const client = await createWriteClientForAction("라이브 투표 Admin Client 생성 실패");

  if (!client.success) return false;

  const { error } = await client.supabase.rpc("vote_live_poll", {
    p_actor_user_id: actor.userId,
    p_poll_id: pollId,
    p_option_id: trimmedOptionId,
  });

  if (error) {
    console.error("라이브 투표 RPC 실패", error);
    return false;
  }

  return true;
}

export async function sendLiveDonationAction(params: {
  broadcastId: string;
  amount: number;
  message: string;
  isAnonymous: boolean;
  idempotencyKey: string;
}): Promise<AppActionResult> {
  const { broadcastId, amount, message, isAnonymous, idempotencyKey } = params;

  if (
    !broadcastId ||
    !isUuid(broadcastId) ||
    !idempotencyKey ||
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    message.length > LIVE_DONATION_MESSAGE_MAX_LENGTH
  ) {
    return { success: false, code: APP_MESSAGE_CODE.error.live.donationInvalid };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 후원 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const client = await createWriteClientForAction(
    "라이브 후원 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.live.donationFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { error } = await client.supabase.rpc("send_live_donation", {
    p_actor_user_id: actor.userId,
    p_broadcast_id: broadcastId,
    p_amount: amount,
    p_message: message,
    p_is_anonymous: isAnonymous,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    // 잔액부족·후원중지 등은 정상적인 거부이므로 에러 로그를 남기지 않는다.
    if (!isKnownDonationRpcError(error)) {
      console.error("라이브 후원 RPC 실패", error);
    }

    return {
      success: false,
      code: resolveDonationRpcErrorCode(error, APP_MESSAGE_CODE.error.live.donationFailed),
    };
  }

  return { success: true };
}

export async function acceptLiveChatRuleAction(
  creatorId: string,
): Promise<AppActionResult<{ acceptedVersion: number }>> {
  if (!creatorId || !isUuid(creatorId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 채팅 규칙 동의 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const client = await createWriteClientForAction<{ acceptedVersion: number }>(
    "라이브 채팅 규칙 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.common.unknown,
  );

  if (!client.success) {
    return client.result;
  }

  const { data: acceptedVersion, error } = await client.supabase.rpc("accept_live_chat_rule", {
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
