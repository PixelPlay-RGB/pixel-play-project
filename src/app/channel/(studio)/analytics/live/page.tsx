// 채널 실시간 통계 페이지를 렌더링합니다.
import { RadioTower } from "lucide-react";

import { AnalyticsEmptyState } from "@/components/channel/analytics/analytics-empty-state";
import { ChannelAnalyticsView } from "@/components/channel/analytics/channel-analytics-view";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { ANALYTICS_LABEL } from "@/constants/channel/analytics";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";

import { getChannelAnalyticsSnapshot } from "../_data/channel-analytics-data";

export default async function ChannelAnalyticsLivePage() {
  const result = await getChannelAnalyticsSnapshot();

  if (!result.success || !result.data) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.channel.analyticsLoadFailed} />;
  }

  const snapshot = result.data;

  if (!snapshot.broadcast) {
    return (
      <AnalyticsEmptyState
        icon={RadioTower}
        title={ANALYTICS_LABEL.offlineTitle}
        description={ANALYTICS_LABEL.offlineDescription}
      />
    );
  }

  // 활성 방송이 바뀌면 시계열·카운터 상태를 새로 시드하도록 키로 강제 리마운트한다.
  return (
    <ChannelAnalyticsView
      key={snapshot.broadcast.id}
      snapshot={{ ...snapshot, broadcast: snapshot.broadcast }}
    />
  );
}
