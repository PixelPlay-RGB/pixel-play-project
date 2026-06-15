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
import type { Json } from "@/types/database.types";
import type {
  CreatorSubscriptionActionResult,
  CreatorSubscriptionStatus,
  SendLiveMessageResult,
} from "@/types/live/live";
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

const CREATOR_SUBSCRIPTION_STATUSES: readonly CreatorSubscriptionStatus[] = [
  "active",
  "expired",
  "canceled",
];

function isCreatorSubscriptionStatus(value: unknown): value is CreatorSubscriptionStatus {
  return CREATOR_SUBSCRIPTION_STATUSES.includes(value as CreatorSubscriptionStatus);
}

function normalizeCreatorSubscriptionResult(data: unknown): CreatorSubscriptionActionResult | null {
  if (!isRecord(data)) return null;

  const id = data.id;
  const isSubscribed = data.isSubscribed;
  const alreadySubscribed = data.alreadySubscribed;
  const startedAt = data.startedAt;
  const endAt = data.endAt;
  const totalMonths = data.totalMonths;
  const status = data.status;

  if (typeof id !== "string") return null;
  if (typeof isSubscribed !== "boolean") return null;
  if (typeof alreadySubscribed !== "boolean") return null;
  if (typeof startedAt !== "string") return null;
  if (typeof endAt !== "string") return null;
  if (typeof totalMonths !== "number") return null;
  if (!isCreatorSubscriptionStatus(status)) return null;

  return {
    id,
    isSubscribed,
    alreadySubscribed,
    startedAt,
    endAt,
    totalMonths,
    status,
  };
}

const LIVE_DRAW_PARTICIPATION_SOURCE = "live_draw_participation";

interface JoinLiveDrawInput {
  broadcastId: string;
  drawNoticeId: string;
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

export async function subscribeCreatorAction({
  creatorId,
}: {
  creatorId: string;
}): Promise<AppActionResult<CreatorSubscriptionActionResult>> {
  if (!creatorId || !isUuid(creatorId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.live.subscriptionFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 구독 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const client = await createWriteClientForAction<CreatorSubscriptionActionResult>(
    "라이브 구독 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.live.subscriptionFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { data, error } = await client.supabase.rpc("subscribe_creator", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
  });

  if (error) {
    console.error("라이브 구독 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.live.subscriptionFailed };
  }

  const result = normalizeCreatorSubscriptionResult(data);

  if (!result) {
    console.error("라이브 구독 RPC 응답 형식 오류", data);
    return { success: false, code: APP_MESSAGE_CODE.error.live.subscriptionFailed };
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.live.subscribed,
    data: result,
  };
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

export async function joinLiveDrawAction({
  broadcastId,
  drawNoticeId,
}: JoinLiveDrawInput): Promise<boolean> {
  if (!broadcastId || !isUuid(broadcastId) || !drawNoticeId || !isUuid(drawNoticeId)) {
    return false;
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 추첨 참여 중 인증 사용자 조회 실패",
  });

  if (!actor.success) return false;

  const client = await createWriteClientForAction("라이브 추첨 참여 Admin Client 생성 실패");

  if (!client.success) return false;

  const supabase = client.supabase;
  const { data: drawNoticeRows, error: noticeError } = await supabase
    .from("live_message")
    .select("id")
    .eq("id", drawNoticeId)
    .eq("broadcast_id", broadcastId)
    .eq("message_type", "moderation_notice")
    .contains("metadata", {
      interactionType: "draw",
      source: "live_interaction",
      status: "active",
    })
    .limit(1);

  if (noticeError || (drawNoticeRows ?? []).length === 0) {
    console.error("라이브 추첨 참여 대상 알림 조회 실패", noticeError);
    return false;
  }

  const { data: activeBroadcastRows, error: broadcastError } = await supabase
    .from("live_broadcast")
    .select("id")
    .eq("id", broadcastId)
    .is("ended_at", null)
    .limit(1);

  if (broadcastError || (activeBroadcastRows ?? []).length === 0) {
    console.error("라이브 추첨 참여 대상 방송 조회 실패", broadcastError);
    return false;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("live_message")
    .select("id")
    .eq("broadcast_id", broadcastId)
    .eq("sender_id", actor.userId)
    .eq("message_type", "moderation_notice")
    .contains("metadata", {
      drawNoticeId,
      source: LIVE_DRAW_PARTICIPATION_SOURCE,
    })
    .limit(1);

  if (existingError) {
    console.error("라이브 추첨 기존 참여 조회 실패", existingError);
    return false;
  }

  if ((existingRows ?? []).length > 0) {
    return true;
  }

  const metadata: Json = {
    drawNoticeId,
    source: LIVE_DRAW_PARTICIPATION_SOURCE,
  };

  const { error: insertError } = await supabase.from("live_message").insert({
    broadcast_id: broadcastId,
    content: "draw participation",
    message_type: "moderation_notice",
    metadata,
    sender_id: actor.userId,
  });

  if (insertError) {
    console.error("라이브 추첨 참여 저장 실패", insertError);
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
    return { success: false, code: APP_MESSAGE_CODE.error.live.donationFailed };
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

// 시청자 식별 키 — 로그인 시청자는 신뢰 가능한 user id('u:'), 익명 시청자는
// 클라이언트가 생성한 세션 토큰('a:')을 쓴다. 로그인 여부는 서버에서 판단하므로
// 클라이언트가 보낸 익명 키는 비로그인일 때만 채택한다(스푸핑 방어).
const ANON_VIEWER_KEY_MAX_LENGTH = 64;

async function resolveLiveViewerKey(anonViewerKey: string | undefined): Promise<string | null> {
  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 시청자 집계 중 인증 사용자 조회 실패",
  });

  if (actor.success) return `u:${actor.userId}`;

  const trimmed = anonViewerKey?.trim() ?? "";

  if (!trimmed || trimmed.length > ANON_VIEWER_KEY_MAX_LENGTH) return null;

  return `a:${trimmed}`;
}

// 시청자 하트비트 sync/leave 공통 골격 — RPC 이름에서 로그 라벨까지 도출한다.
// 실패는 화면에 영향을 주지 않는 부수효과라 조용히 로깅만 한다.
async function runLiveViewerPresenceRpc(
  rpc: "sync_live_viewer_presence" | "leave_live_viewer_presence",
  broadcastId: string,
  anonViewerKey: string | undefined,
): Promise<void> {
  if (!broadcastId || !isUuid(broadcastId)) return;

  const viewerKey = await resolveLiveViewerKey(anonViewerKey);

  if (!viewerKey) return;

  const action = rpc === "sync_live_viewer_presence" ? "집계" : "이탈";

  const client = await createWriteClientForAction(`라이브 시청자 ${action} Admin Client 생성 실패`);

  if (!client.success) return;

  const { error } = await client.supabase.rpc(rpc, {
    p_broadcast_id: broadcastId,
    p_viewer_key: viewerKey,
  });

  if (error) {
    console.error(`라이브 시청자 ${action} RPC 실패`, error);
  }
}

// 시청 화면 하트비트 — current_viewer_count 집계용(로그인·익명 모두 집계).
export async function syncLiveViewerPresenceAction(
  broadcastId: string,
  anonViewerKey?: string,
): Promise<void> {
  await runLiveViewerPresenceRpc("sync_live_viewer_presence", broadcastId, anonViewerKey);
}

// 시청 화면 이탈 시 본인 하트비트를 제거해 시청자 수를 즉시 줄인다.
export async function leaveLiveViewerPresenceAction(
  broadcastId: string,
  anonViewerKey?: string,
): Promise<void> {
  await runLiveViewerPresenceRpc("leave_live_viewer_presence", broadcastId, anonViewerKey);
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
