"use client";
// 방송 운영 화면에서 현재 방송의 핵심 실시간 지표를 요약합니다.

import { useCreatorLiveStats } from "@/hooks/channel/use-creator-live-stats";
import { formatNumber } from "@/utils/common/format";

interface LiveMetricsBroadcast {
  chatMessageCount: number;
  currentViewerCount: number;
  donationAmountTotal: number;
  donationCount: number;
  id: string;
  peakViewerCount: number;
  startedAt: string;
  title: string;
}

interface Props {
  broadcast: LiveMetricsBroadcast | null;
}

interface MetricItem {
  label: string;
  value: string;
}

function buildMetricItems({
  currentViewers,
  donationAmountTotal,
  messagesPerMinute,
  peakViewers,
}: {
  currentViewers: number;
  donationAmountTotal: number;
  messagesPerMinute: number | null;
  peakViewers: number;
}): MetricItem[] {
  return [
    { label: "현재 시청자", value: formatNumber(currentViewers) },
    { label: "최고 시청자", value: formatNumber(peakViewers) },
    { label: "분당 채팅", value: formatNumber(messagesPerMinute ?? 0) },
    { label: "후원 누적", value: `${formatNumber(donationAmountTotal)}P` },
  ];
}

function ChannelLiveStatusMetricsFrame({ items }: { items: MetricItem[] }) {
  return (
    // 풀블리드 섹션(ChannelLiveCollapsibleSection) 안에 들어가므로 카드 래퍼·제목 없이 내용만 둔다.
    <section className="flex min-w-0 flex-col">
      <dl className="divide-border flex flex-col divide-y divide-dashed">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex min-h-8 items-center justify-between gap-4 py-1.5 text-sm font-bold"
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="text-foreground shrink-0 text-right font-black tabular-nums">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ChannelLiveStatusMetricsRealtimeCard({ broadcast }: { broadcast: LiveMetricsBroadcast }) {
  const stats = useCreatorLiveStats(broadcast);

  return (
    <ChannelLiveStatusMetricsFrame
      items={buildMetricItems({
        currentViewers: stats.currentViewers,
        donationAmountTotal: stats.donationAmountTotal,
        messagesPerMinute: stats.messagesPerMinute,
        peakViewers: stats.peakViewers,
      })}
    />
  );
}

export default function ChannelLiveStatusMetricsCard({ broadcast }: Props) {
  if (!broadcast) {
    return (
      <ChannelLiveStatusMetricsFrame
        items={buildMetricItems({
          currentViewers: 0,
          donationAmountTotal: 0,
          messagesPerMinute: 0,
          peakViewers: 0,
        })}
      />
    );
  }

  return <ChannelLiveStatusMetricsRealtimeCard broadcast={broadcast} />;
}
