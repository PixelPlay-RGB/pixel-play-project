"use client";
// 채널 실시간 통계 화면을 조립합니다(KPI 카드 · 시청자 추이 · 상호작용 로그).

import { useMemo, useState } from "react";

import { Coins, MessageSquare, UserPlus, Users } from "lucide-react";

import { AnalyticsConnectionStatus } from "@/components/channel/analytics/analytics-connection-status";
import { AnalyticsInteractionLog } from "@/components/channel/analytics/analytics-interaction-log";
import { AnalyticsRangeSelector } from "@/components/channel/analytics/analytics-range-selector";
import { AnalyticsStatCard } from "@/components/channel/analytics/analytics-stat-card";
import { AnalyticsViewerTrendChart } from "@/components/channel/analytics/analytics-viewer-trend-chart";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import {
  ANALYTICS_LABEL,
  ANALYTICS_RANGE_OPTIONS,
  ANALYTICS_UNIT,
} from "@/constants/channel/analytics";
import { useCreatorDonationFeed } from "@/hooks/channel/use-creator-donation-feed";
import { useCreatorFollowGrowth } from "@/hooks/channel/use-creator-follow-growth";
import { useCreatorLivePresence } from "@/hooks/channel/use-creator-live-presence";
import { useCreatorLiveStats } from "@/hooks/channel/use-creator-live-stats";
import type {
  AnalyticsBroadcast,
  AnalyticsLogEvent,
  AnalyticsRange,
  ChannelAnalyticsSnapshot,
} from "@/types/channel/analytics";
import { resolveConnectionState } from "@/utils/channel/realtime-reconnect";

interface Props {
  snapshot: ChannelAnalyticsSnapshot & { broadcast: AnalyticsBroadcast };
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function ChannelAnalyticsView({ snapshot }: Props) {
  const { creatorId, broadcast, recentDonations } = snapshot;
  const presence = useCreatorLivePresence(broadcast.id, broadcast.currentViewerCount);
  const stats = useCreatorLiveStats(broadcast, presence.viewers);
  const donationFeed = useCreatorDonationFeed(broadcast.id, recentDonations);
  const followGrowth = useCreatorFollowGrowth(creatorId);
  const [range, setRange] = useState<AnalyticsRange>("30m");

  const connection = resolveConnectionState([
    stats.connection,
    presence.connection,
    donationFeed.connection,
  ]);

  const logEvents = useMemo<AnalyticsLogEvent[]>(
    () =>
      [...donationFeed.events, ...(followGrowth.data?.events ?? [])].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      ),
    [donationFeed.events, followGrowth.data],
  );

  const rangeMs = ANALYTICS_RANGE_OPTIONS.find((option) => option.value === range)?.ms ?? null;
  const visibleSamples = useMemo(() => {
    if (rangeMs === null || stats.samples.length === 0) {
      return stats.samples;
    }

    // 최신 샘플 시각을 기준으로 범위를 잘라 렌더 중 Date.now() 호출을 피한다.
    const latestAt = stats.samples[stats.samples.length - 1].at;
    const minAt = latestAt - rangeMs;

    return stats.samples.filter((sample) => sample.at >= minAt);
  }, [stats.samples, rangeMs]);

  return (
    <SettingsPage
      kicker={ANALYTICS_LABEL.kicker}
      title={ANALYTICS_LABEL.title}
      description={ANALYTICS_LABEL.description}
      action={<AnalyticsConnectionStatus state={connection} />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsStatCard
          icon={Users}
          label={ANALYTICS_LABEL.currentViewers}
          value={`${formatNumber(presence.viewers)}${ANALYTICS_UNIT.viewers}`}
          hint={
            presence.isAggregating
              ? `${ANALYTICS_LABEL.peakViewersPrefix} ${formatNumber(stats.peakViewers)}${ANALYTICS_UNIT.viewers}`
              : ANALYTICS_LABEL.viewersPending
          }
          trend={presence.isAggregating ? stats.viewerTrend : undefined}
        />
        <AnalyticsStatCard
          icon={MessageSquare}
          label={ANALYTICS_LABEL.messagesPerMinute}
          value={
            stats.messagesPerMinute === null
              ? ANALYTICS_LABEL.placeholder
              : `${formatNumber(stats.messagesPerMinute)}${ANALYTICS_UNIT.messagesPerMinute}`
          }
          hint={ANALYTICS_LABEL.messagesPerMinuteWindow}
          trend={stats.messagesPerMinuteTrend}
        />
        <AnalyticsStatCard
          icon={Coins}
          label={ANALYTICS_LABEL.cumulativeDonation}
          value={`${formatNumber(stats.donationAmountTotal)}${ANALYTICS_UNIT.point}`}
          hint={`${formatNumber(stats.donationCount)}${ANALYTICS_UNIT.donationCount}`}
          trend={stats.donationTrend}
        />
        <AnalyticsStatCard
          icon={UserPlus}
          label={ANALYTICS_LABEL.followGrowth}
          value={`+${formatNumber(followGrowth.data?.count ?? 0)}`}
          hint={followGrowth.isError ? ANALYTICS_LABEL.followError : ANALYTICS_LABEL.recentWindow}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SettingsCard
          className="xl:col-span-2"
          title={ANALYTICS_LABEL.viewerTrendTitle}
          description={ANALYTICS_LABEL.viewerTrendDescription}
        >
          <AnalyticsRangeSelector value={range} onChange={setRange} />
          <AnalyticsViewerTrendChart samples={visibleSamples} />
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
