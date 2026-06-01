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
import { isKnownMessageRpcError, resolveMessageRpcErrorCode } from "@/utils/common/app-message";
import { isUuid } from "@/utils/common/uuid";

export async function sendLiveMessageAction(
  broadcastId: string,
  content: string,
): Promise<AppActionResult<{ messageId: string }>> {
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

  const client = await createWriteClientForAction<{ messageId: string }>(
    "라이브 채팅 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.message.sendFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { data: messageId, error } = await client.supabase.rpc("send_live_message", {
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

export async function voteLivePollAction(pollId: string, optionId: string): Promise<boolean> {
  if (!pollId || !isUuid(pollId) || !optionId) return false;

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 투표 중 인증 사용자 조회 실패",
  });

  if (!actor.success) return false;

  const client = await createWriteClientForAction("라이브 투표 Admin Client 생성 실패");

  if (!client.success) return false;

  const { error } = await client.supabase.rpc("vote_live_poll", {
    p_actor_user_id: actor.userId,
    p_poll_id: pollId,
    p_option_id: optionId,
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
}): Promise<boolean> {
  const { broadcastId, amount, message, isAnonymous, idempotencyKey } = params;

  if (
    !broadcastId ||
    !isUuid(broadcastId) ||
    !idempotencyKey ||
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    message.length > LIVE_DONATION_MESSAGE_MAX_LENGTH
  )
    return false;

  const actor = await getAuthenticatedActorId({
    logLabel: "라이브 후원 중 인증 사용자 조회 실패",
  });

  if (!actor.success) return false;

  const client = await createWriteClientForAction("라이브 후원 Admin Client 생성 실패");

  if (!client.success) return false;

  const { error } = await client.supabase.rpc("send_live_donation", {
    p_actor_user_id: actor.userId,
    p_broadcast_id: broadcastId,
    p_amount: amount,
    p_message: message,
    p_is_anonymous: isAnonymous,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    console.error("라이브 후원 RPC 실패", error);
    return false;
  }

  return true;
}

export async function getLiveDonationRankingAction(
  creatorId: string,
): Promise<
  AppActionResult<{
    donations: { id: string; author: string | null; amount: number; message: string }[];
  }>
> {
  if (!creatorId || !isUuid(creatorId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const client = await createWriteClientForAction<{
    donations: { id: string; author: string | null; amount: number; message: string }[];
  }>("라이브 후원 랭킹 Admin Client 생성 실패");

  if (!client.success) {
    return client.result;
  }

  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  const { data, error } = await client.supabase
    .from("donation")
    .select("id, donor_id, amount, message, is_anonymous, created_at, donor:donor_id(nickname)")
    .eq("creator_id", creatorId)
    .gte("created_at", weekStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<
      {
        id: string;
        donor_id: string;
        amount: number;
        message: string;
        is_anonymous: boolean;
        created_at: string;
        donor: { nickname: string } | null;
      }[]
    >();

  if (error) {
    console.error("라이브 후원 랭킹 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const ranking = new Map<
    string,
    { id: string; author: string | null; amount: number; message: string; createdAt: string }
  >();

  for (const donation of data ?? []) {
    const key = `${donation.donor_id}:${donation.is_anonymous ? "anonymous" : "public"}`;
    const current = ranking.get(key);

    if (!current) {
      ranking.set(key, {
        id: donation.id,
        author: donation.is_anonymous ? null : (donation.donor?.nickname ?? null),
        amount: donation.amount,
        message: donation.message,
        createdAt: donation.created_at,
      });
      continue;
    }

    ranking.set(key, {
      ...current,
      amount: current.amount + donation.amount,
    });
  }

  const donations = [...ranking.values()]
    .sort((a, b) => b.amount - a.amount || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map((donation) => ({
      id: donation.id,
      author: donation.author,
      amount: donation.amount,
      message: donation.message,
    }));

  return { success: true, data: { donations } };
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
