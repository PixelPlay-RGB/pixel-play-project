// 지난 방송 분석(종료 요약 지표) 화면을 조립합니다.

import { AnalyticsReportCard } from "@/components/channel/analytics/analytics-report-card";
import { SettingsPage } from "@/components/common/settings-page";
import { ANALYTICS_LABEL } from "@/constants/channel/analytics";
import type { BroadcastReport } from "@/types/channel/analytics";

interface Props {
  reports: BroadcastReport[];
}

export function ChannelAnalyticsReportView({ reports }: Props) {
  return (
    <SettingsPage
      kicker={ANALYTICS_LABEL.reportKicker}
      title={ANALYTICS_LABEL.reportTitle}
      description={ANALYTICS_LABEL.reportDescription}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {reports.map((report) => (
          <AnalyticsReportCard key={report.id} report={report} />
        ))}
      </div>
    </SettingsPage>
  );
}
