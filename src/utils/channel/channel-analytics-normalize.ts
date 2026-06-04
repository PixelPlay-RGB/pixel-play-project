// live_broadcast·donation Realtime payload를 검증·정규화해 앱 타입으로 변환합니다.

import type { AnalyticsLogEvent } from "@/types/channel/analytics";
import { readNumber, readObject, readText } from "@/utils/channel/channel-analytics-read";

export interface NormalizedBroadcastCounters {
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

  return { id, type: "donation", at, amount };
}
