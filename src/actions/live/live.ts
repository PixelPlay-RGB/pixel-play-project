"use server";
// 라이브 채팅 메시지와 채팅 규칙 동의 RPC를 호출하는 서버 액션입니다.

import { randomUUID } from "crypto";

import { cookies } from "next/headers";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createWriteClientForAction } from "@/actions/common/admin-client-action";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import {
  ANON_VIEWER_COOKIE,
  LIVE_CHAT_MESSAGE_MAX_LENGTH,
  LIVE_DONATION_MESSAGE_MAX_LENGTH,
} from "@/constants/live/live";
import type { AppActionResult } from "@/types/common/action";
import type { Json } from "@/types/database.types";
import type { SendLiveMessageResult } from "@/types/live/live";
import {
  isKnownDonationRpcError,
  isKnownMessageRpcError,
  resolveDonationRpcErrorCode,
  resolveMessageRpcErrorCode,
} from "@/utils/common/app-message";
import { isRecord } from "@/utils/common/json";
import { isUuid } from "@/utils/common/uuid";
import { signAnonViewerKey, verifyAnonViewerKey } from "@/utils/live/live-security";

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

const LIVE_DRAW_PARTICIPATION_SOURCE = "live_draw_participation";

interface JoinLiveDrawInput {
  broadcastId: string;
  drawNoticeId: string;
}

// 채팅은 채널(creator) 단위다 — 방송 중이면 RPC가 메시지를 활성 방송에 자동 귀속시키고,
// 방송 외 시간에는 채널 메시지(broadcast_id null)로 기록한다(#111).
export async function sendLiveMessageAction(
  creatorId: string,
  content: string,
): Promise<AppActionResult<SendLiveMessageResult>> {
  const trimmed = content.trim();

  if (!creatorId || !isUuid(creatorId)) {
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

  const { data, error } = await client.supabase.rpc("send_live_message_v3", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
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
    .select("id, creator_id")
    .eq("id", broadcastId)
    .is("ended_at", null)
    .limit(1);

  const activeBroadcast = (activeBroadcastRows ?? [])[0];

  if (broadcastError || !activeBroadcast) {
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
    creator_id: activeBroadcast.creator_id,
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

// 후원도 채널(creator) 단위다 — 방송 중이면 RPC가 활성 방송에 자동 귀속시키고,
// 방송 외 시간에는 채널 후원(broadcast_id null)으로 기록한다(#111).
export async function sendLiveDonationAction(params: {
  creatorId: string;
  amount: number;
  message: string;
  isAnonymous: boolean;
  idempotencyKey: string;
}): Promise<AppActionResult> {
  const { creatorId, amount, message, isAnonymous, idempotencyKey } = params;

  if (
    !creatorId ||
    !isUuid(creatorId) ||
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

  const { error } = await client.supabase.rpc("send_live_donation_v2", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
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
// 서버가 발급·검증하는 HttpOnly 쿠키('a:')를 쓴다. 서명 덕에 클라이언트가 '지정한' 익명 신원을
// 위조할 순 없다(#97 A 트랙). 단 쿠키를 매번 비우고 신규 발급을 반복하는 부풀림은 막지 못하며,
// 이는 후속 레이트리밋(⑤)에서 완화한다(MVP 허용). 로그인 여부는 서버에서 판단한다.
async function resolveLiveViewerKey({
  allowIssueAnonCookie,
}: {
  allowIssueAnonCookie: boolean;
}): Promise<string | null> {
  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 시청자 집계 중 인증 사용자 조회 실패",
  });

  if (actor.success) return `u:${actor.userId}`;

  const cookieStore = await cookies();
  const existing = cookieStore.get(ANON_VIEWER_COOKIE)?.value;

  if (existing) {
    const verifiedUuid = verifyAnonViewerKey(existing);
    if (verifiedUuid) return `a:${verifiedUuid}`;
  }

  // 쿠키가 없거나 변조됐다. 하트비트(sync)에서만 새로 발급하고, 이탈(leave)에선 발급하지 않는다 —
  // 신원 없는 이탈은 지울 행도 없어 no-op이면 충분하고, 퇴장 순간 새 신원을 만들 이유도 없다.
  // ⚠️ 불변식: leave 경로는 절대 쿠키를 set하지 않는다. leave는 훅 cleanup에서 서버 액션으로
  // 직접 호출되는데, 서버 액션에서 쿠키를 set하면 라우터 캐시가 무효화돼 재생 화면이 새로고침된다
  // (그래서 sync만 라우트 핸들러로 분리했다). 이 게이트가 그 불변식을 강제한다.
  if (!allowIssueAnonCookie) return null;

  const uuid = randomUUID();
  // maxAge를 두지 않아 세션 쿠키로 발급한다(브라우저 종료 시 소멸). SameSite=Lax라 동일 출처
  // fetch/sendBeacon에 자동 동봉되고, HttpOnly라 클라이언트 스크립트가 신원을 읽거나 위조할 수 없다.
  cookieStore.set(ANON_VIEWER_COOKIE, `${uuid}.${signAnonViewerKey(uuid)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return `a:${uuid}`;
}

// 시청자 하트비트 sync/leave 공통 골격 — RPC 이름에서 로그 라벨까지 도출한다.
// 실패는 화면에 영향을 주지 않는 부수효과라 조용히 로깅만 한다.
async function runLiveViewerPresenceRpc(
  rpc: "sync_live_viewer_presence" | "leave_live_viewer_presence",
  broadcastId: string,
): Promise<void> {
  if (!broadcastId || !isUuid(broadcastId)) return;

  const viewerKey = await resolveLiveViewerKey({
    allowIssueAnonCookie: rpc === "sync_live_viewer_presence",
  });

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
// 신원은 서버가 쿠키로 해석·발급하므로 broadcastId만 받는다.
export async function syncLiveViewerPresenceAction(broadcastId: string): Promise<void> {
  await runLiveViewerPresenceRpc("sync_live_viewer_presence", broadcastId);
}

// 시청 화면 이탈 시 본인 하트비트를 제거해 시청자 수를 즉시 줄인다.
export async function leaveLiveViewerPresenceAction(broadcastId: string): Promise<void> {
  await runLiveViewerPresenceRpc("leave_live_viewer_presence", broadcastId);
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
