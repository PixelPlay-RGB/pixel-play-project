"use client";
// shadcn 차트 컨테이너와 공통 툴팁을 제공합니다.

import { cn } from "@/lib/utils";
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type {
  ResponsiveContainerProps,
  TooltipContentProps,
  TooltipPayloadEntry,
  TooltipValueType,
} from "recharts";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: ResponsiveContainerProps["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-layer]:outline-hidden",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border",
          "[&_.recharts-radial-bar-background-sector]:fill-muted",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-sector]:outline-hidden",
          "[&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, itemConfig]) => {
    return itemConfig.theme || itemConfig.color;
  });

  if (colorConfig.length === 0) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => {
            const variables = colorConfig
              .map(([key, itemConfig]) => {
                const color =
                  itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;

                return color ? `  --color-${key}: ${color};` : null;
              })
              .filter(Boolean)
              .join("\n");

            return `${prefix} [data-chart=${id}] {\n${variables}\n}`;
          })
          .join("\n"),
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  hideIndicator = false,
  labelFormatter,
  valueFormatter,
}: Partial<TooltipContentProps> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    labelFormatter?: (
      label: TooltipContentProps["label"],
      payload: TooltipContentProps["payload"],
    ) => React.ReactNode;
    valueFormatter?: (
      value: TooltipValueType | undefined,
      item: TooltipPayloadEntry,
    ) => React.ReactNode;
  }) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-background/95 text-foreground grid min-w-36 gap-2 rounded-lg border px-3 py-2 text-xs shadow-md backdrop-blur-sm",
        className,
      )}
    >
      {!hideLabel ? (
        <div className="font-black">{labelFormatter ? labelFormatter(label, payload) : label}</div>
      ) : null}

      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = `${item.dataKey ?? item.name ?? ""}`;
          const itemConfig = config[key];
          const indicatorColor = item.color || item.fill || "var(--brand)";

          return (
            <div key={key} className="flex min-w-0 items-center gap-2">
              {!hideIndicator ? (
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: indicatorColor }}
                  aria-hidden
                />
              ) : null}
              <span className="text-muted-foreground min-w-0 flex-1 truncate">
                {itemConfig?.label ?? item.name ?? key}
              </span>
              <span className="text-foreground shrink-0 font-black">
                {valueFormatter ? valueFormatter(item.value, item) : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
