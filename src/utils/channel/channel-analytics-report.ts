// 종료된 live_broadcast 행을 지난 방송 분석 요약(BroadcastReport)으로 정규화합니다.
import type { BroadcastReport } from "@/types/channel/analytics";

interface BroadcastReportRow {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  chat_message_count: number;
  donation_count: number;
  donation_amount_total: number;
}

export function mapBroadcastReportRow(row: BroadcastReportRow): BroadcastReport | null {
  // 종료된 방송만 다룬다(ended_at 보장).
  if (!row.ended_at) {
    return null;
  }

  const durationMs = Math.max(
    0,
    new Date(row.ended_at).getTime() - new Date(row.started_at).getTime(),
  );

  return {
    id: row.id,
    title: row.title,
    startedAt: row.started_at,
    durationMs,
    chatMessageCount: row.chat_message_count,
    donationCount: row.donation_count,
    donationAmountTotal: row.donation_amount_total,
  };
}
