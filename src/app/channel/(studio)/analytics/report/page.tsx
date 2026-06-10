// 채널 지난 방송 분석 페이지를 렌더링합니다.
import { History } from "lucide-react";

import { AnalyticsEmptyState } from "@/components/channel/analytics/analytics-empty-state";
import { ChannelAnalyticsReportView } from "@/components/channel/analytics/channel-analytics-report-view";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { ANALYTICS_LABEL, REPORT_PERIOD_DEFAULT } from "@/constants/channel/analytics";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { resolveReportPage, resolveReportPeriod } from "@/utils/channel/channel-analytics-report";

import { getCreatorBroadcastReports } from "../_data/channel-analytics-report-data";

interface Props {
  searchParams: Promise<{ period?: string; page?: string }>;
}

export default async function ChannelAnalyticsReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const period = resolveReportPeriod(params.period);
  const page = resolveReportPage(params.page);
  const result = await getCreatorBroadcastReports(period);

  if (!result.success || !result.data) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.channel.analyticsLoadFailed} />;
  }

  const { reports, totalChatParticipants } = result.data;

  // 기간 무관 전체가 비어 있을 때만 친절한 빈 상태(필터를 바꿀 게 없음).
  if (reports.length === 0 && period === REPORT_PERIOD_DEFAULT) {
    return (
      <AnalyticsEmptyState
        icon={History}
        title={ANALYTICS_LABEL.reportEmptyTitle}
        description={ANALYTICS_LABEL.reportEmptyDescription}
      />
    );
  }

  return (
    <ChannelAnalyticsReportView
      reports={reports}
      totalChatParticipants={totalChatParticipants}
      period={period}
      page={page}
    />
  );
}
