// 지난 방송 분석 상단: 선택 기간 내 종료 방송들의 누적 합계를 KPI 카드로 보여줍니다.

import { Clock, Coins, MessagesSquare, Radio, Users } from "lucide-react";

import { AnalyticsStatCard } from "@/components/channel/analytics/analytics-stat-card";
import { ANALYTICS_LABEL, ANALYTICS_UNIT } from "@/constants/channel/analytics";
import type { BroadcastReportSummary } from "@/types/channel/analytics";
import { formatPeakViewers } from "@/utils/channel/channel-analytics-report";
import { formatDurationKo } from "@/utils/common/date";
import { formatNumber } from "@/utils/common/format";

interface Props {
  summary: BroadcastReportSummary;
}

export function AnalyticsReportSummary({ summary }: Props) {
  const cards = [
    {
      icon: Radio,
      label: ANALYTICS_LABEL.reportSummaryBroadcasts,
      value: `${formatNumber(summary.broadcastCount)}${ANALYTICS_UNIT.broadcast}`,
    },
    {
      icon: Clock,
      label: ANALYTICS_LABEL.reportSummaryDuration,
      value: formatDurationKo(summary.totalDurationMs),
    },
    {
      icon: Users,
      label: ANALYTICS_LABEL.reportSummaryPeak,
      value: formatPeakViewers(summary.peakViewerCount),
    },
    {
      icon: MessagesSquare,
      label: ANALYTICS_LABEL.reportSummaryChat,
      value: `${formatNumber(summary.chatParticipantCount)}${ANALYTICS_LABEL.reportParticipantSuffix}`,
    },
    {
      icon: Coins,
      label: ANALYTICS_LABEL.reportSummaryDonation,
      value: `${formatNumber(summary.totalDonationAmount)}${ANALYTICS_UNIT.point}`,
      hint: `${formatNumber(summary.totalDonationCount)}${ANALYTICS_LABEL.reportDonationCountSuffix}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ icon, label, value, hint }) => (
        <AnalyticsStatCard key={label} icon={icon} label={label} value={value} hint={hint} />
      ))}
    </div>
  );
}
