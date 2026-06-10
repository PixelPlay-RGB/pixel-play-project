"use client";
// 채널 실시간 통계 화면을 조립합니다(모멘텀·참여·후원 KPI · 시청자 추이 · 상호작용 로그).

import { useMemo, useState } from "react";

import { Coins, Gauge, MessagesSquare, UserPlus, Users } from "lucide-react";

import { AnalyticsConnectionStatus } from "@/components/channel/analytics/analytics-connection-status";
import { AnalyticsElapsed } from "@/components/channel/analytics/analytics-elapsed";
import { AnalyticsInteractionLog } from "@/components/channel/analytics/analytics-interaction-log";
import { AnalyticsRangeSelector } from "@/components/channel/analytics/analytics-range-selector";
import { AnalyticsStatCard } from "@/components/channel/analytics/analytics-stat-card";
import { AnalyticsTopSupporter } from "@/components/channel/analytics/analytics-top-supporter";
import { AnalyticsViewerTrendChart } from "@/components/channel/analytics/analytics-viewer-trend-chart";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import {
  ANALYTICS_LABEL,
  ANALYTICS_RANGE_OPTIONS,
  ANALYTICS_UNIT,
} from "@/constants/channel/analytics";
import { useCreatorChatParticipants } from "@/hooks/channel/use-creator-chat-participants";
import { useCreatorDonationFeed } from "@/hooks/channel/use-creator-donation-feed";
import { useCreatorFollowFeed } from "@/hooks/channel/use-creator-follow-feed";
import { useCreatorLiveStats } from "@/hooks/channel/use-creator-live-stats";
import type {
  AnalyticsBroadcast,
  AnalyticsLogEvent,
  AnalyticsRange,
  ChannelAnalyticsSnapshot,
} from "@/types/channel/analytics";
import {
  deriveChatParticipationRate,
  deriveTopSupporter,
} from "@/utils/channel/channel-analytics-metrics";
import { resolveConnectionState } from "@/utils/channel/realtime-reconnect";

interface Props {
  snapshot: ChannelAnalyticsSnapshot & { broadcast: AnalyticsBroadcast };
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

// 여러 보조 정보를 가운뎃점으로 합치되 비어 있는 조각은 버린다.
function joinHints(...parts: (string | null | false)[]): string | undefined {
  const filled = parts.filter((part): part is string => Boolean(part));

  return filled.length > 0 ? filled.join(" · ") : undefined;
}

export function ChannelAnalyticsView({ snapshot }: Props) {
  const { creatorId, broadcast, recentDonations } = snapshot;
  const stats = useCreatorLiveStats(broadcast);
  const participants = useCreatorChatParticipants(broadcast.id);
  const donationFeed = useCreatorDonationFeed(broadcast.id, recentDonations);
  const followFeed = useCreatorFollowFeed(creatorId);
  const [range, setRange] = useState<AnalyticsRange>("30m");

  const connection = resolveConnectionState([
    stats.connection,
    participants.connection,
    donationFeed.connection,
    followFeed.connection,
  ]);

  const logEvents = useMemo<AnalyticsLogEvent[]>(
    () =>
      [...donationFeed.events, ...followFeed.events].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      ),
    [donationFeed.events, followFeed.events],
  );

  const topSupporter = useMemo(
    () => deriveTopSupporter(donationFeed.events),
    [donationFeed.events],
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

  const avgDonation =
    stats.donationCount > 0 ? Math.round(stats.donationAmountTotal / stats.donationCount) : 0;
  const participationRate = deriveChatParticipationRate(
    participants.uniqueCount,
    stats.currentViewers,
  );

  return (
    <SettingsPage
      kicker={ANALYTICS_LABEL.kicker}
      title={ANALYTICS_LABEL.title}
      description={ANALYTICS_LABEL.description}
      action={
        <div className="flex items-center gap-4">
          <AnalyticsElapsed startedAt={broadcast.startedAt} />
          <AnalyticsConnectionStatus state={connection} />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AnalyticsStatCard
          icon={Users}
          label={ANALYTICS_LABEL.currentViewers}
          value={`${formatNumber(stats.currentViewers)}${ANALYTICS_UNIT.viewers}`}
          hint={buildViewersHint(stats.peakViewers, stats.peakRatio)}
          trend={stats.viewerTrend}
        />
        <AnalyticsStatCard
          icon={Gauge}
          label={ANALYTICS_LABEL.averageViewers}
          value={`${formatNumber(stats.averageViewers)}${ANALYTICS_UNIT.viewers}`}
          hint={ANALYTICS_LABEL.averageViewersHint}
        />
        <AnalyticsStatCard
          icon={MessagesSquare}
          label={ANALYTICS_LABEL.chatParticipants}
          value={`${formatNumber(participants.uniqueCount)}${ANALYTICS_LABEL.chatParticipantsValueSuffix}`}
          hint={joinHints(
            participationRate !== null
              ? `${ANALYTICS_LABEL.chatParticipantsRatePrefix} ${participationRate}%`
              : null,
            stats.messagesPerMinute !== null
              ? `${formatNumber(stats.messagesPerMinute)}${ANALYTICS_UNIT.messagesPerMinute}`
              : null,
          )}
        />
        <AnalyticsStatCard
          icon={Coins}
          label={ANALYTICS_LABEL.cumulativeDonation}
          value={`${formatNumber(stats.donationAmountTotal)}${ANALYTICS_UNIT.point}`}
          hint={joinHints(
            `${formatNumber(stats.donationCount)}${ANALYTICS_UNIT.donationCount}`,
            stats.donationCount > 0
              ? `${ANALYTICS_LABEL.donationAveragePrefix} ${formatNumber(avgDonation)}${ANALYTICS_UNIT.point}`
              : null,
            stats.donationPacePerMinute
              ? `${ANALYTICS_LABEL.donationPacePrefix} ${formatNumber(stats.donationPacePerMinute)}${ANALYTICS_UNIT.pointPerMinute}`
              : null,
          )}
          trend={stats.donationTrend}
        />
        <AnalyticsStatCard
          icon={UserPlus}
          label={ANALYTICS_LABEL.followGrowth}
          value={`${followFeed.count >= 0 ? "+" : ""}${formatNumber(followFeed.count)}`}
          hint={followFeed.isError ? ANALYTICS_LABEL.followError : ANALYTICS_LABEL.recentWindow}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SettingsCard
          className="xl:col-span-2"
          title={ANALYTICS_LABEL.viewerTrendTitle}
          description={ANALYTICS_LABEL.viewerTrendDescription}
        >
          <AnalyticsRangeSelector value={range} onChange={setRange} />
          <AnalyticsViewerTrendChart
            samples={visibleSamples}
            average={stats.averageViewers}
            range={range}
          />
        </SettingsCard>
        <SettingsCard
          title={ANALYTICS_LABEL.interactionLogTitle}
          description={ANALYTICS_LABEL.interactionLogDescription}
        >
          <AnalyticsTopSupporter supporter={topSupporter} />
          <AnalyticsInteractionLog events={logEvents} />
        </SettingsCard>
      </div>
    </SettingsPage>
  );
}

// 현재 시청자 카드 보조 텍스트: 최고 동접 + 최고 대비 위치(모멘텀)를 함께 보여준다.
function buildViewersHint(peakViewers: number, peakRatio: number | null): string {
  const peakLabel = `${ANALYTICS_LABEL.peakViewersPrefix} ${peakViewers.toLocaleString("ko-KR")}${ANALYTICS_UNIT.viewers}`;

  const ratioLabel =
    peakRatio === null
      ? null
      : peakRatio === 0
        ? ANALYTICS_LABEL.peakRatioAtPeak
        : `${ANALYTICS_LABEL.peakRatioPrefix} ${peakRatio}%`;

  return joinHints(peakLabel, ratioLabel) ?? peakLabel;
}
