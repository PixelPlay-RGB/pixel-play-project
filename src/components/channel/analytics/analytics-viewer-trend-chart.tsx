"use client";
// 시청자 추이를 누적 샘플 기반 영역 차트로 렌더링합니다.

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { ANALYTICS_UNIT } from "@/constants/channel/analytics";
import type { AnalyticsSample } from "@/types/channel/analytics";

interface Props {
  samples: AnalyticsSample[];
}

const CHART_CONFIG: ChartConfig = {
  viewers: { label: "시청자", color: "var(--color-brand)" },
};

function formatTime(at: number) {
  return new Date(at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function AnalyticsViewerTrendChart({ samples }: Props) {
  const data = samples.map((sample) => ({ at: sample.at, viewers: sample.viewers }));

  return (
    <ChartContainer config={CHART_CONFIG} className="h-64">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="analytics-viewers-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-viewers)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-viewers)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="at"
          tickFormatter={formatTime}
          tickLine={false}
          axisLine={false}
          minTickGap={48}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <YAxis
          width={36}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <Tooltip
          labelFormatter={(label) => formatTime(Number(label))}
          formatter={(value) => [
            `${Number(value).toLocaleString("ko-KR")}${ANALYTICS_UNIT.viewers}`,
            "시청자",
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "var(--color-popover)",
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="viewers"
          stroke="var(--color-viewers)"
          strokeWidth={2}
          fill="url(#analytics-viewers-fill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
