// live_broadcast·donation Realtime payload를 검증·정규화해 앱 타입으로 변환합니다.

import type { AnalyticsLogEvent } from "@/types/channel/analytics";
import { readNumber, readObject, readText } from "@/utils/channel/channel-analytics-read";

export interface NormalizedBroadcastCounters {
  currentViewers: number;
  peakViewers: number;
  chatMessageCount: number;
  donationCount: number;
  donationAmountTotal: number;
}

// 구독 filter가 보장하더라도 payload의 id·숫자 필드를 재검증해 NaN/음수 유입을 막는다.
export function normalizeLiveBroadcastCounters(
  value: unknown,
  expectedBroadcastId: string,
): NormalizedBroadcastCounters | null {
  const row = readObject(value);

  if (!row || readText(row.id) !== expectedBroadcastId) {
    return null;
  }

  return {
    currentViewers: Math.max(0, readNumber(row.current_viewer_count, 0)),
    peakViewers: Math.max(0, readNumber(row.peak_viewer_count, 0)),
    chatMessageCount: Math.max(0, readNumber(row.chat_message_count, 0)),
    donationCount: Math.max(0, readNumber(row.donation_count, 0)),
    donationAmountTotal: Math.max(0, readNumber(row.donation_amount_total, 0)),
  };
}

export function normalizeDonationRow(
  value: unknown,
  expectedBroadcastId: string,
): AnalyticsLogEvent | null {
  const row = readObject(value);

  if (!row || readText(row.broadcast_id) !== expectedBroadcastId) {
    return null;
  }

  const id = readText(row.id);
  const at = readText(row.created_at);
  const amount = readNumber(row.amount, 0);

  // 후원은 최소 포인트(>0)만 유효하다. 0·음수·NaN은 비정상 payload로 보고 버린다.
  if (!id || !at || amount <= 0) {
    return null;
  }

  // 표시 닉네임은 donation 행에 박힌 donor_nickname(익명은 alias). donor_id는 노출하지 않는다.
  const actorName = readText(row.donor_nickname) ?? undefined;

  return { id, type: "donation", at, amount, actorName };
}

// creator_follow_event 행(초기 쿼리·Realtime payload 공통)을 상호작용 로그 이벤트로 변환한다.
export function normalizeFollowEventRow(
  value: unknown,
  expectedCreatorId: string,
): AnalyticsLogEvent | null {
  const row = readObject(value);

  if (!row || readText(row.creator_id) !== expectedCreatorId) {
    return null;
  }

  const id = readText(row.id);
  const at = readText(row.created_at);
  const eventType = readText(row.event_type);

  if (!id || !at || (eventType !== "follow" && eventType !== "unfollow")) {
    return null;
  }

  // 닉네임은 트리거가 박은 viewer_nickname(없으면 이름 없이 표기). viewer_id는 노출하지 않는다.
  const actorName = readText(row.viewer_nickname) ?? undefined;

  return { id, type: eventType, at, actorName };
}
