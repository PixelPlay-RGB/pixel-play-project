"use client";
// 채널 실시간 통계 화면을 조립합니다(KPI 카드 · 시청자 추이 · 상호작용 로그).

import { useMemo } from "react";

import { Coins, MessageSquare, UserPlus, Users } from "lucide-react";

import { AnalyticsInteractionLog } from "@/components/channel/analytics/analytics-interaction-log";
import { AnalyticsStatCard } from "@/components/channel/analytics/analytics-stat-card";
import { AnalyticsViewerTrendChart } from "@/components/channel/analytics/analytics-viewer-trend-chart";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { ANALYTICS_LABEL, ANALYTICS_UNIT } from "@/constants/channel/analytics";
import { useCreatorDonationFeed } from "@/hooks/channel/use-creator-donation-feed";
import { useCreatorFollowGrowth } from "@/hooks/channel/use-creator-follow-growth";
import { useCreatorLiveStats } from "@/hooks/channel/use-creator-live-stats";
import type {
  AnalyticsBroadcast,
  AnalyticsLogEvent,
  ChannelAnalyticsSnapshot,
} from "@/types/channel/analytics";

interface Props {
  snapshot: ChannelAnalyticsSnapshot & { broadcast: AnalyticsBroadcast };
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function ChannelAnalyticsView({ snapshot }: Props) {
  const { creatorId, broadcast, recentDonations } = snapshot;
  const stats = useCreatorLiveStats(broadcast);
  const donations = useCreatorDonationFeed(broadcast.id, recentDonations);
  const followGrowth = useCreatorFollowGrowth(creatorId);

  const logEvents = useMemo<AnalyticsLogEvent[]>(
    () =>
      [...donations, ...(followGrowth.data?.events ?? [])].sort((a, b) => b.at.localeCompare(a.at)),
    [donations, followGrowth.data],
  );

  const messagesPerMinute = stats.messagesPerMinute;

  return (
    <SettingsPage
      kicker={ANALYTICS_LABEL.kicker}
      title={ANALYTICS_LABEL.title}
      description={ANALYTICS_LABEL.description}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsStatCard
          icon={Users}
          label={ANALYTICS_LABEL.currentViewers}
          value={`${formatNumber(stats.currentViewers)}${ANALYTICS_UNIT.viewers}`}
          hint={`${ANALYTICS_LABEL.peakViewersPrefix} ${formatNumber(stats.peakViewers)}${ANALYTICS_UNIT.viewers}`}
        />
        <AnalyticsStatCard
          icon={MessageSquare}
          label={ANALYTICS_LABEL.messagesPerMinute}
          value={
            messagesPerMinute === null
              ? ANALYTICS_LABEL.placeholder
              : `${formatNumber(messagesPerMinute)}${ANALYTICS_UNIT.messagesPerMinute}`
          }
          hint={ANALYTICS_LABEL.messagesPerMinuteWindow}
          trend={stats.messagesPerMinuteTrend}
        />
        <AnalyticsStatCard
          icon={Coins}
          label={ANALYTICS_LABEL.cumulativeDonation}
          value={`${formatNumber(stats.donationAmountTotal)}${ANALYTICS_UNIT.point}`}
          hint={`${formatNumber(stats.donationCount)}${ANALYTICS_UNIT.donationCount}`}
        />
        <AnalyticsStatCard
          icon={UserPlus}
          label={ANALYTICS_LABEL.followGrowth}
          value={`+${formatNumber(followGrowth.data?.count ?? 0)}`}
          hint={ANALYTICS_LABEL.recentWindow}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SettingsCard
          className="xl:col-span-2"
          title={ANALYTICS_LABEL.viewerTrendTitle}
          description={ANALYTICS_LABEL.viewerTrendDescription}
        >
          <AnalyticsViewerTrendChart samples={stats.samples} />
        </SettingsCard>
        <SettingsCard
          title={ANALYTICS_LABEL.interactionLogTitle}
          description={ANALYTICS_LABEL.interactionLogDescription}
        >
          <AnalyticsInteractionLog events={logEvents} />
        </SettingsCard>
      </div>
    </SettingsPage>
  );
}
