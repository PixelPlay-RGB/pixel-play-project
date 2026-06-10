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
    // 풀블리드 섹션(ChannelLiveCollapsibleSection) 안 — 실시간 통계와 같은 미니 카드 그리드로 보여준다.
    <section className="flex min-w-0 flex-col">
      <dl className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-border bg-muted/30 flex min-w-0 flex-col gap-1 rounded-lg border px-3 py-2.5"
          >
            <dt className="text-muted-foreground truncate text-xs font-bold">{item.label}</dt>
            <dd className="text-foreground truncate text-base font-black tabular-nums">
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
