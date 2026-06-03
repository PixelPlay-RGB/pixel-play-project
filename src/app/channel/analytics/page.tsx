// 채널 실시간 통계 페이지를 렌더링합니다.
import { AnalyticsLoadFailedState } from "@/components/channel/analytics/analytics-load-failed-state";
import { AnalyticsOfflineState } from "@/components/channel/analytics/analytics-offline-state";
import { ChannelAnalyticsView } from "@/components/channel/analytics/channel-analytics-view";

import { getChannelAnalyticsSnapshot } from "./_data/channel-analytics-data";

export default async function ChannelAnalyticsPage() {
  const result = await getChannelAnalyticsSnapshot();

  if (!result.success || !result.data) {
    return <AnalyticsLoadFailedState />;
  }

  const snapshot = result.data;

  if (!snapshot.broadcast) {
    return <AnalyticsOfflineState />;
  }

  return <ChannelAnalyticsView snapshot={{ ...snapshot, broadcast: snapshot.broadcast }} />;
}
