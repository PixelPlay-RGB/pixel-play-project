// 지난 방송 분석(종료 요약 지표) 화면을 조립합니다.
// 상단 = 선택 기간 누적 합계, 우상단 = 기간 선택기, 하단 = 방송별 목록(데스크톱 표 / 모바일 카드).

import { AnalyticsReportCard } from "@/components/channel/analytics/analytics-report-card";
import { AnalyticsReportSummary } from "@/components/channel/analytics/analytics-report-summary";
import { AnalyticsReportTable } from "@/components/channel/analytics/analytics-report-table";
import { ReportPagination } from "@/components/channel/analytics/report-pagination";
import { ReportPeriodSelector } from "@/components/channel/analytics/report-period-selector";
import { SettingsPage } from "@/components/common/settings-page";
import { ANALYTICS_LABEL, REPORT_PAGE_SIZE } from "@/constants/channel/analytics";
import type { BroadcastReport, BroadcastReportPeriod } from "@/types/channel/analytics";
import { summarizeBroadcastReports } from "@/utils/channel/channel-analytics-report";

interface Props {
  reports: BroadcastReport[];
  totalChatParticipants: number;
  period: BroadcastReportPeriod;
  page: number;
}

export function ChannelAnalyticsReportView({
  reports,
  totalChatParticipants,
  period,
  page,
}: Props) {
  const isEmpty = reports.length === 0;
  // 합계는 항상 기간 전체(reports)를 집계한다. 페이징은 목록 표시에만 적용.
  const summary = summarizeBroadcastReports(reports, totalChatParticipants);

  const totalPages = Math.max(1, Math.ceil(reports.length / REPORT_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageReports = reports.slice(
    (currentPage - 1) * REPORT_PAGE_SIZE,
    currentPage * REPORT_PAGE_SIZE,
  );

  return (
    <SettingsPage
      kicker={ANALYTICS_LABEL.reportKicker}
      title={ANALYTICS_LABEL.reportTitle}
      description={ANALYTICS_LABEL.reportDescription}
      action={<ReportPeriodSelector value={period} />}
    >
      {isEmpty ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
          {ANALYTICS_LABEL.reportPeriodEmpty}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <AnalyticsReportSummary summary={summary} />

          {/* 데스크톱: 표 */}
          <div className="hidden md:block">
            <AnalyticsReportTable reports={pageReports} />
          </div>

          {/* 모바일: 카드 */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {pageReports.map((report) => (
              <AnalyticsReportCard key={report.id} report={report} />
            ))}
          </div>

          <ReportPagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}
    </SettingsPage>
  );
}
