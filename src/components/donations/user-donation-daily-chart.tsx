"use client";
// 선택한 월의 보낸 후원 금액을 일자별 차트로 표시합니다.

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { UserDonationSnapshot } from "@/types/donations/user-donations";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { TooltipPayloadEntry, TooltipValueType } from "recharts";
import { useMemo, useRef } from "react";

interface Props {
  snapshot: UserDonationSnapshot;
}

interface DonationDailyChartItem {
  day: number;
  dayLabel: string;
  amount: number;
  count: number;
}

const DONATION_DAILY_CHART_CONFIG = {
  amount: {
    label: "보낸 후원",
    color: "var(--brand)",
  },
} satisfies ChartConfig;

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export function UserDonationDailyChart({ snapshot }: Props) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chartData = useMemo(() => buildDonationDailyChartData(snapshot), [snapshot]);
  const totalAmount = chartData.reduce((total, item) => total + item.amount, 0);
  const totalCount = chartData.reduce((total, item) => total + item.count, 0);
  const chartWidth = Math.max(chartData.length * 52, 360);
  const periodLabel = `${snapshot.historyPeriod.year}년 ${snapshot.historyPeriod.month}월`;

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea || scrollArea.scrollWidth <= scrollArea.clientWidth) {
      return;
    }

    const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

    if (delta === 0) {
      return;
    }

    event.preventDefault();
    scrollArea.scrollLeft += delta;
  };

  if (chartData.length === 0) {
    return (
      <div className="border-border bg-muted/20 flex min-h-44 flex-col justify-center gap-2 rounded-lg border border-dashed p-4">
        <p className="text-foreground text-sm font-black">표시할 후원 기간 없음</p>
        <p className="text-muted-foreground text-xs">
          {periodLabel}은 아직 그래프로 표시할 수 있는 날짜가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-black">{periodLabel} 보낸 후원</p>
          <p className="text-foreground mt-1 text-2xl leading-tight font-black">
            {formatPoint(totalAmount)}
          </p>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs font-semibold">{totalCount}건</p>
      </div>

      <div ref={scrollAreaRef} className="overflow-x-auto pb-2" onWheel={handleWheel} tabIndex={0}>
        <div style={{ width: chartWidth }} className="h-56">
          <ChartContainer
            config={DONATION_DAILY_CHART_CONFIG}
            className="aspect-auto h-full w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={54}
                tickFormatter={formatCompactPoint}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                    valueFormatter={formatTooltipValue}
                  />
                }
              />
              <Bar
                dataKey="amount"
                fill="var(--color-amount)"
                radius={[6, 6, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}

function buildDonationDailyChartData(snapshot: UserDonationSnapshot): DonationDailyChartItem[] {
  const { year, month } = snapshot.historyPeriod;
  const visibleDayCount = getVisibleDayCount(year, month);
  const chartData = Array.from({ length: visibleDayCount }, (_, index) => ({
    day: index + 1,
    dayLabel: `${index + 1}일`,
    amount: 0,
    count: 0,
  }));

  snapshot.sentDonations.forEach((donation) => {
    const donationDate = getKstDateParts(donation.createdAt);

    if (
      donationDate.year !== year ||
      donationDate.month !== month ||
      donationDate.day > visibleDayCount
    ) {
      return;
    }

    const dayItem = chartData[donationDate.day - 1];

    if (!dayItem) {
      return;
    }

    dayItem.amount += donation.amount;
    dayItem.count += 1;
  });

  return chartData;
}

function getVisibleDayCount(year: number, month: number) {
  const today = getKstDateParts(new Date());

  if (year > today.year || (year === today.year && month > today.month)) {
    return 0;
  }

  if (year === today.year && month === today.month) {
    return today.day;
  }

  return getDaysInMonth(year, month);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getKstDateParts(value: string | Date) {
  const parts = KST_DATE_FORMATTER.formatToParts(new Date(value));

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? 0),
    month: Number(parts.find((part) => part.type === "month")?.value ?? 0),
    day: Number(parts.find((part) => part.type === "day")?.value ?? 0),
  };
}

function formatTooltipValue(value: TooltipValueType | undefined, item: TooltipPayloadEntry) {
  const chartItem = item.payload as DonationDailyChartItem | undefined;
  const amount = readTooltipNumber(value);

  return `${formatPoint(amount)} (${chartItem?.count ?? 0}건)`;
}

function readTooltipNumber(value: TooltipValueType | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value) || 0;
  }

  return 0;
}

function formatCompactPoint(value: number) {
  if (value >= 10000) {
    return `${Math.round(value / 10000)}만`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}천`;
  }

  return String(value);
}

function formatPoint(value: number) {
  return `${value.toLocaleString("ko-KR")}P`;
}
