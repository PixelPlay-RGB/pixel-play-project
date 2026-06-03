"use client";
// recharts 차트에 반응형 컨테이너와 색상 토큰(CSS 변수)을 주입하는 경량 래퍼입니다.

import * as React from "react";
import { ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: string; color?: string }>;

interface ChartContainerProps {
  config: ChartConfig;
  className?: string;
  children: React.ReactElement;
}

export function ChartContainer({ config, className, children }: ChartContainerProps) {
  const style = React.useMemo(() => {
    const variables: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      if (value.color) {
        variables[`--color-${key}`] = value.color;
      }
    }
    return variables as React.CSSProperties;
  }, [config]);

  return (
    <div data-slot="chart" className={cn("h-full w-full", className)} style={style}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
