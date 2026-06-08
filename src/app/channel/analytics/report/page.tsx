// 채널 지난 방송 분석 페이지를 렌더링합니다.
import { AnalyticsLoadFailedState } from "@/components/channel/analytics/analytics-load-failed-state";
import { AnalyticsReportEmptyState } from "@/components/channel/analytics/analytics-report-empty-state";
import { ChannelAnalyticsReportView } from "@/components/channel/analytics/channel-analytics-report-view";

import { getCreatorBroadcastReports } from "../_data/channel-analytics-report-data";

export default async function ChannelAnalyticsReportPage() {
  const result = await getCreatorBroadcastReports();

  if (!result.success || !result.data) {
    return <AnalyticsLoadFailedState />;
  }

  if (result.data.length === 0) {
    return <AnalyticsReportEmptyState />;
  }

  return <ChannelAnalyticsReportView reports={result.data} />;
}
