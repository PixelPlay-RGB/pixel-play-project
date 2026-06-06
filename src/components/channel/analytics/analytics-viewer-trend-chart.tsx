"use client";
// 시청자 추이를 누적 샘플 기반 영역 차트로 렌더링합니다.

import { memo, useMemo } from "react";

import { Area, AreaChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { ANALYTICS_LABEL, ANALYTICS_UNIT } from "@/constants/channel/analytics";
import type { AnalyticsRange, AnalyticsSample } from "@/types/channel/analytics";
import { buildTimeTicks, resolveTickIntervalMs } from "@/utils/channel/channel-analytics-chart";
import { formatKstTime } from "@/utils/common/date";

interface Props {
  samples: AnalyticsSample[];
  average: number; // 평균 동시 시청자 기준선(0이면 표시 안 함)
  range: AnalyticsRange; // X축 눈금 간격을 범위에 맞춰 정한다
}

const CHART_CONFIG: ChartConfig = {
  viewers: { label: ANALYTICS_LABEL.currentViewers, color: "var(--color-brand)" },
};

// 카운터·후원 등 차트와 무관한 갱신으로 recharts가 재조정되지 않도록 memo한다.
export const AnalyticsViewerTrendChart = memo(function AnalyticsViewerTrendChart({
  samples,
  average,
  range,
}: Props) {
  const data = useMemo(
    () => samples.map((sample) => ({ at: sample.at, viewers: sample.viewers })),
    [samples],
  );

  // X축은 시간 비례 축으로 그리고, 범위별 정시 간격 눈금을 직접 지정한다.
  const { domain, ticks } = useMemo(() => {
    if (data.length === 0) {
      return { domain: undefined, ticks: undefined };
    }

    const minAt = data[0].at;
    const maxAt = data[data.length - 1].at;
    const intervalMs = resolveTickIntervalMs(range, maxAt - minAt);

    return {
      domain: [minAt, maxAt] as [number, number],
      ticks: buildTimeTicks(minAt, maxAt, intervalMs),
    };
  }, [data, range]);

  return (
    <ChartContainer config={CHART_CONFIG} className="h-52">
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
          type="number"
          scale="time"
          domain={domain}
          ticks={ticks}
          tickFormatter={formatKstTime}
          tickLine={false}
          axisLine={false}
          minTickGap={20}
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
            ANALYTICS_LABEL.currentViewers,
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "var(--color-popover)",
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
        />
        {average > 0 && (
          <ReferenceLine
            y={average}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="4 4"
            label={{
              value: `${ANALYTICS_LABEL.averageViewers} ${average.toLocaleString("ko-KR")}${ANALYTICS_UNIT.viewers}`,
              position: "insideTopRight",
              fontSize: 11,
              fill: "var(--color-muted-foreground)",
            }}
          />
        )}
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
