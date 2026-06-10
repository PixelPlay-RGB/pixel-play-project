// 종료된 live_broadcast 행을 지난 방송 분석 요약(BroadcastReport)으로 정규화하고,
// 기간 합계 파생·기간 프리셋 해석을 담당합니다.
import {
  ANALYTICS_LABEL,
  ANALYTICS_UNIT,
  REPORT_PERIOD_DEFAULT,
  REPORT_PERIOD_OPTIONS,
} from "@/constants/channel/analytics";
import type {
  BroadcastReport,
  BroadcastReportPeriod,
  BroadcastReportSummary,
} from "@/types/channel/analytics";
import { formatDurationKo } from "@/utils/common/date";
import { formatNumber } from "@/utils/common/format";

interface BroadcastReportRow {
  id: string;
  title: string;
  thumbnail_url: string | null;
  started_at: string;
  ended_at: string | null;
  peak_viewer_count: number;
  donation_count: number;
  donation_amount_total: number;
}

// 채팅 참여자 수는 live_message에서 별도 집계해 주입한다(broadcast 행에 없음).
export function mapBroadcastReportRow(
  row: BroadcastReportRow,
  chatParticipantCount: number,
): BroadcastReport | null {
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
    thumbnailUrl: row.thumbnail_url,
    startedAt: row.started_at,
    durationMs,
    peakViewerCount: row.peak_viewer_count,
    chatParticipantCount,
    donationCount: row.donation_count,
    donationAmountTotal: row.donation_amount_total,
  };
}

// 기간 내 종료 방송들을 상단 누적 합계 한 줄로 접는다.
// 참여자 합집합(totalChatParticipants)은 방송별 카운트의 합이 아니라서 별도로 받는다.
export function summarizeBroadcastReports(
  reports: BroadcastReport[],
  totalChatParticipants: number,
): BroadcastReportSummary {
  return reports.reduce<BroadcastReportSummary>(
    (acc, report) => ({
      broadcastCount: acc.broadcastCount + 1,
      totalDurationMs: acc.totalDurationMs + report.durationMs,
      peakViewerCount: Math.max(acc.peakViewerCount, report.peakViewerCount),
      // 참여자는 합산이 아니라 시드의 기간 합집합(totalChatParticipants)을 그대로 전달한다.
      chatParticipantCount: acc.chatParticipantCount,
      totalDonationCount: acc.totalDonationCount + report.donationCount,
      totalDonationAmount: acc.totalDonationAmount + report.donationAmountTotal,
    }),
    {
      broadcastCount: 0,
      totalDurationMs: 0,
      peakViewerCount: 0,
      chatParticipantCount: totalChatParticipants,
      totalDonationCount: 0,
      totalDonationAmount: 0,
    },
  );
}

// 최고 동접 표기. 동접 writer 합류 전에는 0이라 "—"로 둔다(가짜 0 숫자 노출 방지).
// 카드·표·상단 합계가 공유한다(복붙 금지).
export function formatPeakViewers(count: number): string {
  return count > 0
    ? `${formatNumber(count)}${ANALYTICS_LABEL.reportPeakSuffix}`
    : ANALYTICS_LABEL.placeholder;
}

// 방송 한 건의 지표 표시 문자열을 만든다(카드·표가 공유 — 포맷 로직 단일화).
export function formatBroadcastReportMetrics(report: BroadcastReport) {
  return {
    duration: formatDurationKo(report.durationMs),
    peak: formatPeakViewers(report.peakViewerCount),
    participant: `${formatNumber(report.chatParticipantCount)}${ANALYTICS_LABEL.reportParticipantSuffix}`,
    donation: `${formatNumber(report.donationAmountTotal)}${ANALYTICS_UNIT.point} · ${formatNumber(report.donationCount)}${ANALYTICS_LABEL.reportDonationCountSuffix}`,
  };
}

// URL searchParams의 period 값을 허용된 프리셋으로 좁힌다(미지정·오타는 기본값).
export function resolveReportPeriod(value: string | undefined): BroadcastReportPeriod {
  const matched = REPORT_PERIOD_OPTIONS.find((option) => option.value === value);
  return matched?.value ?? REPORT_PERIOD_DEFAULT;
}

// URL searchParams의 page 값을 1 이상 정수로 좁힌다(상한은 뷰에서 totalPages로 clamp).
export function resolveReportPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

// 프리셋을 조회 하한(ended_at >= )으로 변환한다. "전체"는 하한 없음(null).
export function getReportPeriodStartIso(period: BroadcastReportPeriod): string | null {
  const option = REPORT_PERIOD_OPTIONS.find((candidate) => candidate.value === period);

  if (!option?.days) {
    return null;
  }

  return new Date(Date.now() - option.days * 24 * 60 * 60 * 1000).toISOString();
}
