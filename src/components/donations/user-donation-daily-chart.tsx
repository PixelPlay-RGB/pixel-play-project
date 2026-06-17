"use client";
// 선택한 월의 충전과 후원·구독 지출 금액을 일자별 차트로 표시합니다.

import type { DonationHistoryTab } from "@/components/donations/user-donation-history-table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { UserDonationSnapshot } from "@/types/donations/user-donations";
import { formatPoint } from "@/utils/donations/format";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { TooltipPayloadEntry, TooltipValueType } from "recharts";
import { useEffect, useMemo, useRef } from "react";

interface Props {
  snapshot: UserDonationSnapshot;
  activeTab: DonationHistoryTab;
}

interface DonationDailyChartItem {
  day: number;
  dayLabel: string;
  chargeAmount: number;
  chargeCount: number;
  donationAmount: number;
  donationCount: number;
}

const DONATION_DAILY_CHART_CONFIG = {
  chargeAmount: {
    label: "후원금 충전",
    color: "var(--brand)",
  },
  donationAmount: {
    label: "후원·구독",
    color: "var(--live)",
  },
} satisfies ChartConfig;

const CHART_HEADER_LABEL: Record<DonationHistoryTab, string> = {
  all: "전체 내역",
  charge: "후원금 충전",
  donation: "후원·구독",
};

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export function UserDonationDailyChart({ snapshot, activeTab }: Props) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chartData = useMemo(() => buildDonationDailyChartData(snapshot), [snapshot]);
  const chargeTotal = chartData.reduce((total, item) => total + item.chargeAmount, 0);
  const donationTotal = chartData.reduce((total, item) => total + item.donationAmount, 0);
  const chargeCount = chartData.reduce((total, item) => total + item.chargeCount, 0);
  const donationCount = chartData.reduce((total, item) => total + item.donationCount, 0);
  const chartWidth = Math.max(chartData.length * getChartDayWidth(activeTab), 360);
  const periodLabel = `${snapshot.historyPeriod.year}년 ${snapshot.historyPeriod.month}월`;

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

      if (delta === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (scrollArea.scrollWidth <= scrollArea.clientWidth) {
        return;
      }

      scrollArea.scrollLeft += delta;
    };

    scrollArea.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollArea.removeEventListener("wheel", handleWheel);
    };
  }, []);

  if (chartData.length === 0) {
    return (
      <div className="border-border bg-muted/20 flex min-h-44 flex-col justify-center gap-2 rounded-lg border border-dashed p-4">
        <p className="text-foreground text-sm font-black">표시할 내역 기간 없음</p>
        <p className="text-muted-foreground text-xs">
          {periodLabel}은 아직 그래프로 표시할 수 있는 날짜가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-black">
            {periodLabel} {CHART_HEADER_LABEL[activeTab]}
          </p>
          <ChartTotalSummary
            activeTab={activeTab}
            chargeTotal={chargeTotal}
            donationTotal={donationTotal}
          />
        </div>
        <p className="text-muted-foreground shrink-0 text-xs font-semibold">
          {formatChartCount(activeTab, chargeCount, donationCount)}
        </p>
      </div>

      <div
        ref={scrollAreaRef}
        className="h-80 min-h-80 overflow-x-auto overflow-y-hidden overscroll-contain pb-4"
        tabIndex={0}
      >
        <div style={{ width: chartWidth }} className="h-72 min-h-72">
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
              {activeTab === "all" || activeTab === "charge" ? (
                <Bar
                  dataKey="chargeAmount"
                  fill="var(--color-chargeAmount)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />
              ) : null}
              {activeTab === "all" || activeTab === "donation" ? (
                <Bar
                  dataKey="donationAmount"
                  fill="var(--color-donationAmount)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />
              ) : null}
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {activeTab === "all" || activeTab === "charge" ? (
          <ChartLegendItem label="후원금 충전" className="bg-brand" />
        ) : null}
        {activeTab === "all" || activeTab === "donation" ? (
          <ChartLegendItem label="후원·구독" className="bg-live" />
        ) : null}
      </div>
    </div>
  );
}

function getChartDayWidth(activeTab: DonationHistoryTab) {
  return activeTab === "all" ? 72 : 56;
}

function buildDonationDailyChartData(snapshot: UserDonationSnapshot): DonationDailyChartItem[] {
  const { year, month } = snapshot.historyPeriod;
  const visibleDayCount = getVisibleDayCount(year, month);
  const chartData = Array.from({ length: visibleDayCount }, (_, index) => ({
    day: index + 1,
    dayLabel: `${index + 1}일`,
    chargeAmount: 0,
    chargeCount: 0,
    donationAmount: 0,
    donationCount: 0,
  }));

  snapshot.chargeHistories
    .filter((charge) => charge.status === "succeeded")
    .forEach((charge) => {
      const chargeDate = getKstDateParts(charge.createdAt);

      if (
        chargeDate.year !== year ||
        chargeDate.month !== month ||
        chargeDate.day > visibleDayCount
      ) {
        return;
      }

      const dayItem = chartData[chargeDate.day - 1];

      if (!dayItem) {
        return;
      }

      dayItem.chargeAmount += charge.amount;
      dayItem.chargeCount += 1;
    });

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

    dayItem.donationAmount += donation.amount;
    dayItem.donationCount += 1;
  });

  snapshot.subscriptionSpendHistories
    .filter((subscription) => subscription.status === "succeeded")
    .forEach((subscription) => {
      const subscriptionDate = getKstDateParts(subscription.createdAt);

      if (
        subscriptionDate.year !== year ||
        subscriptionDate.month !== month ||
        subscriptionDate.day > visibleDayCount
      ) {
        return;
      }

      const dayItem = chartData[subscriptionDate.day - 1];

      if (!dayItem) {
        return;
      }

      dayItem.donationAmount += subscription.amount;
      dayItem.donationCount += 1;
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
  const key = String(item.dataKey ?? "");
  const count = key === "chargeAmount" ? chartItem?.chargeCount : chartItem?.donationCount;

  return `${formatPoint(amount)} (${count ?? 0}건)`;
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

function ChartTotalSummary({
  activeTab,
  chargeTotal,
  donationTotal,
}: {
  activeTab: DonationHistoryTab;
  chargeTotal: number;
  donationTotal: number;
}) {
  if (activeTab === "charge") {
    return (
      <p className="text-brand mt-1 text-2xl leading-tight font-black">
        {formatPoint(chargeTotal)}
      </p>
    );
  }

  if (activeTab === "donation") {
    return (
      <p className="text-live mt-1 text-2xl leading-tight font-black">
        {formatPoint(donationTotal)}
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      <p className="text-brand text-sm font-black">충전 {formatPoint(chargeTotal)}</p>
      <p className="text-live text-sm font-black">후원·구독 {formatPoint(donationTotal)}</p>
    </div>
  );
}

function ChartLegendItem({ label, className }: { label: string; className: string }) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
      <span className={cn("size-2 rounded-full", className)} aria-hidden />
      {label}
    </span>
  );
}

function formatChartCount(
  activeTab: DonationHistoryTab,
  chargeCount: number,
  donationCount: number,
) {
  if (activeTab === "charge") {
    return `${chargeCount}건`;
  }

  if (activeTab === "donation") {
    return `${donationCount}건`;
  }

  return `${chargeCount + donationCount}건`;
}
