// 종료된 방송 한 건의 최종 요약 지표를 카드로 렌더링합니다.

import { Coins, MessagesSquare, Timer } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANALYTICS_LABEL, ANALYTICS_UNIT } from "@/constants/channel/analytics";
import type { BroadcastReport } from "@/types/channel/analytics";
import { formatDurationKo, formatKstDateTime } from "@/utils/common/date";

interface Props {
  report: BroadcastReport;
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function AnalyticsReportCard({ report }: Props) {
  const metrics = [
    {
      icon: Timer,
      label: ANALYTICS_LABEL.reportDuration,
      value: formatDurationKo(report.durationMs),
    },
    {
      icon: MessagesSquare,
      label: ANALYTICS_LABEL.reportChat,
      value: `${formatNumber(report.chatMessageCount)}${ANALYTICS_LABEL.reportChatSuffix}`,
    },
    {
      icon: Coins,
      label: ANALYTICS_LABEL.reportDonation,
      value: `${formatNumber(report.donationAmountTotal)}${ANALYTICS_UNIT.point} · ${formatNumber(report.donationCount)}${ANALYTICS_LABEL.reportDonationCountSuffix}`,
    },
  ];

  return (
    <Card className="gap-4 py-5 shadow-sm">
      <CardHeader className="gap-1 px-5">
        <CardTitle className="truncate text-base">{report.title}</CardTitle>
        <p className="text-muted-foreground text-xs">
          {formatKstDateTime(report.startedAt)} {ANALYTICS_LABEL.reportStartSuffix}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 px-5 sm:grid-cols-3">
        {metrics.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Icon className="size-3.5 shrink-0" />
              {label}
            </span>
            <span className="text-foreground text-sm font-semibold">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
