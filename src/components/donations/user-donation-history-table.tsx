"use client";
// 사용자 후원 지갑의 충전 내역과 후원 내역을 탭으로 표시합니다.

import { SettingsCard } from "@/components/common/settings-card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectLabel,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  UserDonationSnapshot,
  UserSentDonationItem,
  UserWalletChargeHistoryItem,
  WalletTransactionStatus,
} from "@/types/donations/user-donations";
import { CreditCard, Gift, Inbox } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

interface Props {
  snapshot: UserDonationSnapshot;
}

type DonationHistoryTab = "all" | "charge" | "donation";

type DonationHistoryItem =
  | {
      kind: "charge";
      id: string;
      title: string;
      description: string;
      amount: number;
      createdAt: string;
    }
  | {
      kind: "donation";
      id: string;
      title: string;
      description: string;
      amount: number;
      createdAt: string;
    };

const DONATION_HISTORY_TABS: Array<{ value: DonationHistoryTab; label: string }> = [
  { value: "all", label: "전체" },
  { value: "charge", label: "충전" },
  { value: "donation", label: "후원" },
];

const TRANSACTION_STATUS_LABEL: Record<WalletTransactionStatus, string> = {
  pending: "승인 대기",
  succeeded: "승인 완료",
  failed: "승인 실패",
  canceled: "승인 취소",
};

export function UserDonationHistoryTable({ snapshot }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DonationHistoryTab>("all");
  const historyTitle = `${snapshot.historyPeriod.year}년 ${snapshot.historyPeriod.month}월 내역`;
  const historyItems = useMemo(() => buildHistoryItems(snapshot), [snapshot]);
  const yearOptions = useMemo(
    () => buildYearOptions(snapshot.historyPeriod.year),
    [snapshot.historyPeriod.year],
  );
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const filteredItems = useMemo(
    () =>
      activeTab === "all" ? historyItems : historyItems.filter((item) => item.kind === activeTab),
    [activeTab, historyItems],
  );
  const tabCounts = useMemo(
    () => ({
      all: historyItems.length,
      charge: snapshot.chargeHistories.length,
      donation: snapshot.sentDonations.length,
    }),
    [historyItems.length, snapshot.chargeHistories.length, snapshot.sentDonations.length],
  );
  const handlePeriodChange = (nextPeriod: { year?: number; month?: number }) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("year", String(nextPeriod.year ?? snapshot.historyPeriod.year));
    params.set("month", String(nextPeriod.month ?? snapshot.historyPeriod.month));
    params.delete("paymentStatus");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <Tabs
        value={activeTab}
        onValueChange={(nextValue) => setActiveTab(nextValue as DonationHistoryTab)}
      >
        <TabsList
          className={cn(
            "grid h-auto w-full grid-cols-3 gap-1 rounded-xl border p-1 shadow-sm",
            "bg-background/80 dark:bg-card/70",
          )}
        >
          {DONATION_HISTORY_TABS.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={({ active }) =>
                  cn(
                    "h-10 min-w-0 cursor-pointer gap-2 rounded-lg px-2 text-sm font-black",
                    "data-active:bg-background! data-active:text-foreground! dark:data-active:bg-muted!",
                    active
                      ? "shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )
                }
              >
                <span className="truncate">{tab.label}</span>
                {tab.value === "all" ? (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-black",
                      isActive ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tabCounts[tab.value] > 99 ? "99+" : tabCounts[tab.value]}
                  </span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <SettingsCard title={historyTitle} contentClassName="gap-4">
        <HistoryPeriodSelect
          year={snapshot.historyPeriod.year}
          month={snapshot.historyPeriod.month}
          yearOptions={yearOptions}
          monthOptions={monthOptions}
          onChange={handlePeriodChange}
        />
        {filteredItems.length > 0 ? (
          <ul className="divide-border divide-y">
            {filteredItems.map((item) => (
              <HistoryListItem key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyList activeTab={activeTab} />
        )}
      </SettingsCard>
    </section>
  );
}

function HistoryPeriodSelect({
  year,
  month,
  yearOptions,
  monthOptions,
  onChange,
}: {
  year: number;
  month: number;
  yearOptions: number[];
  monthOptions: number[];
  onChange: (nextPeriod: { year?: number; month?: number }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={String(year)}
        items={yearOptions.map((option) => ({
          label: `${option}년`,
          value: String(option),
        }))}
        onValueChange={(nextValue) => onChange({ year: Number(nextValue) })}
      >
        <SelectTrigger aria-label="조회 연도" className="h-9 w-28 min-w-28 rounded-lg">
          <SelectValue placeholder={`${year}년`} />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>조회 연도</SelectLabel>
            <SelectList>
              {yearOptions.map((option) => (
                <SelectItem key={option} value={String(option)} label={`${option}년`}>
                  {option}년
                </SelectItem>
              ))}
            </SelectList>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={String(month)}
        items={monthOptions.map((option) => ({
          label: `${option}월`,
          value: String(option),
        }))}
        onValueChange={(nextValue) => onChange({ month: Number(nextValue) })}
      >
        <SelectTrigger aria-label="조회 월" className="h-9 w-24 min-w-24 rounded-lg">
          <SelectValue placeholder={`${month}월`} />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>조회 월</SelectLabel>
            <SelectList>
              {monthOptions.map((option) => (
                <SelectItem key={option} value={String(option)} label={`${option}월`}>
                  {option}월
                </SelectItem>
              ))}
            </SelectList>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function HistoryListItem({ item }: { item: DonationHistoryItem }) {
  const isCharge = item.kind === "charge";

  return (
    <li className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          isCharge ? "bg-brand/10 text-brand" : "bg-live/10 text-live",
        )}
      >
        {isCharge ? <CreditCard className="size-5" /> : <Gift className="size-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-black">{item.title}</p>
        <p className="text-muted-foreground mt-1 truncate text-xs">{item.description}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={cn("text-sm font-black", isCharge ? "text-brand" : "text-live")}>
          {isCharge ? "+" : "-"}
          {formatPoint(item.amount)}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{formatKstTime(item.createdAt)}</p>
      </div>
    </li>
  );
}

function EmptyList({ activeTab }: { activeTab: DonationHistoryTab }) {
  const label = DONATION_HISTORY_TABS.find((tab) => tab.value === activeTab)?.label ?? "전체";

  return (
    <div className="border-border bg-muted/20 flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
      <div className="bg-background text-muted-foreground flex size-10 items-center justify-center rounded-lg border">
        <Inbox className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">{label} 내역 없음</p>
        <p className="text-muted-foreground text-xs">표시할 후원 지갑 내역이 없습니다.</p>
      </div>
    </div>
  );
}

function buildHistoryItems(snapshot: UserDonationSnapshot): DonationHistoryItem[] {
  const chargeItems = snapshot.chargeHistories.map(readChargeHistoryItem);
  const donationItems = snapshot.sentDonations.map(readSentDonationItem);

  return [...chargeItems, ...donationItems].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function buildYearOptions(selectedYear: number) {
  const currentYear = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Seoul",
      year: "numeric",
    }).format(new Date()),
  );
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  if (!years.includes(selectedYear)) {
    years.push(selectedYear);
  }

  return years.sort((left, right) => right - left);
}

function buildMonthOptions() {
  return Array.from({ length: 12 }, (_, index) => index + 1);
}

function readChargeHistoryItem(charge: UserWalletChargeHistoryItem): DonationHistoryItem {
  return {
    kind: "charge",
    id: charge.id,
    title: "후원금 충전",
    description: `Toss Payments ${TRANSACTION_STATUS_LABEL[charge.status]}`,
    amount: charge.amount,
    createdAt: charge.createdAt,
  };
}

function readSentDonationItem(donation: UserSentDonationItem): DonationHistoryItem {
  return {
    kind: "donation",
    id: donation.id,
    title: `${donation.creatorNickname} 방송 후원`,
    description: donation.message || "방송 후원을 보냈습니다.",
    amount: donation.amount,
    createdAt: donation.createdAt,
  };
}

function formatPoint(value: number) {
  return `${value.toLocaleString("ko-KR")}P`;
}

function formatKstTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
