// 종료된 방송 목록을 표로 렌더링합니다(데스크톱). 모바일은 카드(AnalyticsReportCard)로 분기.

import Image from "next/image";
import { Calendar } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ANALYTICS_LABEL } from "@/constants/channel/analytics";
import type { BroadcastReport } from "@/types/channel/analytics";
import { formatBroadcastReportMetrics } from "@/utils/channel/channel-analytics-report";
import { formatKstDateTimeNumeric } from "@/utils/common/date";
import { getLiveThumbnailSrc } from "@/utils/live/live-list";

interface Props {
  reports: BroadcastReport[];
}

export function AnalyticsReportTable({ reports }: Props) {
  return (
    <div className="ring-foreground/10 bg-card overflow-hidden rounded-xl shadow-sm ring-1">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="w-2/5">
              {ANALYTICS_LABEL.reportColBroadcast}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {ANALYTICS_LABEL.reportDuration}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {ANALYTICS_LABEL.reportSummaryPeak}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {ANALYTICS_LABEL.reportParticipant}
            </TableHead>
            <TableHead scope="col" className="text-center">
              {ANALYTICS_LABEL.reportDonation}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const metrics = formatBroadcastReportMetrics(report);
            return (
              <TableRow key={report.id} className="hover:bg-transparent">
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted relative aspect-video w-20 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={getLiveThumbnailSrc(report.id, report.thumbnailUrl)}
                        alt={`${report.title} 방송 썸네일`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground font-medium wrap-break-word">{report.title}</p>
                      <p className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Calendar className="size-3.5 shrink-0" />
                        {formatKstDateTimeNumeric(report.startedAt)}{" "}
                        {ANALYTICS_LABEL.reportStartSuffix}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">{metrics.duration}</TableCell>
                <TableCell className="text-center tabular-nums">{metrics.peak}</TableCell>
                <TableCell className="text-center tabular-nums">{metrics.participant}</TableCell>
                <TableCell className="text-center whitespace-normal tabular-nums">
                  {metrics.donation}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
