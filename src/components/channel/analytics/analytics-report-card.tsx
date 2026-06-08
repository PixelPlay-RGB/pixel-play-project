// 종료된 방송 한 건의 최종 요약 지표를 썸네일 + 지표 카드로 렌더링합니다(모바일).

import Image from "next/image";
import { Calendar, Coins, MessagesSquare, Timer, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANALYTICS_LABEL } from "@/constants/channel/analytics";
import type { BroadcastReport } from "@/types/channel/analytics";
import { formatBroadcastReportMetrics } from "@/utils/channel/channel-analytics-report";
import { formatKstDateTimeNumeric } from "@/utils/common/date";
import { getLiveThumbnailSrc } from "@/utils/live/live-list";

interface Props {
  report: BroadcastReport;
}

export function AnalyticsReportCard({ report }: Props) {
  const formatted = formatBroadcastReportMetrics(report);
  const metrics = [
    { icon: Timer, label: ANALYTICS_LABEL.reportDuration, value: formatted.duration },
    { icon: Users, label: ANALYTICS_LABEL.reportSummaryPeak, value: formatted.peak },
    {
      icon: MessagesSquare,
      label: ANALYTICS_LABEL.reportParticipant,
      value: formatted.participant,
    },
    { icon: Coins, label: ANALYTICS_LABEL.reportDonation, value: formatted.donation },
  ];

  return (
    <Card className="gap-4 py-5 shadow-sm">
      <CardHeader className="gap-3 px-5">
        <div className="bg-muted relative aspect-video overflow-hidden rounded-lg">
          <Image
            src={getLiveThumbnailSrc(report.id, report.thumbnailUrl)}
            alt={`${report.title} 방송 썸네일`}
            fill
            sizes="(min-width: 1024px) 40vw, 92vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="truncate text-base">{report.title}</CardTitle>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <Calendar className="size-3.5 shrink-0" />
            {formatKstDateTimeNumeric(report.startedAt)} {ANALYTICS_LABEL.reportStartSuffix}
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 px-5">
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
