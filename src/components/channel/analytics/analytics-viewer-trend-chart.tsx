"use client";
// 시청자 추이를 누적 샘플 기반 영역 차트로 렌더링합니다.

import { memo, useMemo } from "react";

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { ANALYTICS_LABEL, ANALYTICS_UNIT } from "@/constants/channel/analytics";
import type { AnalyticsSample } from "@/types/channel/analytics";
import { formatKstTime } from "@/utils/common/date";

interface Props {
  samples: AnalyticsSample[];
}

const CHART_CONFIG: ChartConfig = {
  viewers: { label: ANALYTICS_LABEL.viewerSeries, color: "var(--color-brand)" },
};

// 카운터·후원 등 차트와 무관한 갱신으로 recharts가 재조정되지 않도록 memo한다.
export const AnalyticsViewerTrendChart = memo(function AnalyticsViewerTrendChart({ samples }: Props) {
  const data = useMemo(
    () => samples.map((sample) => ({ at: sample.at, viewers: sample.viewers })),
    [samples],
  );

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
          tickFormatter={formatKstTime}
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
          labelFormatter={(label) => formatKstTime(Number(label))}
          formatter={(value) => [
            `${Number(value).toLocaleString("ko-KR")}${ANALYTICS_UNIT.viewers}`,
            ANALYTICS_LABEL.viewerSeries,
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
});
