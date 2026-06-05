"use client";
// 후원 지갑 내역 탭과 그래프가 같은 탭 상태를 공유하도록 묶습니다.

import { SettingsCard } from "@/components/common/settings-card";
import { UserDonationDailyChart } from "@/components/donations/user-donation-daily-chart";
import {
  UserDonationHistoryTable,
  type DonationHistoryTab,
} from "@/components/donations/user-donation-history-table";
import type { UserDonationSnapshot } from "@/types/donations/user-donations";
import { useState } from "react";

interface Props {
  snapshot: UserDonationSnapshot;
}

const GRAPH_CARD_TITLE: Record<DonationHistoryTab, string> = {
  all: "전체 그래프",
  charge: "충전 내역 그래프",
  donation: "후원 내역 그래프",
};

export function UserDonationDashboardSection({ snapshot }: Props) {
  const [activeTab, setActiveTab] = useState<DonationHistoryTab>("all");

  return (
    <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)] xl:items-stretch">
      <UserDonationHistoryTable
        snapshot={snapshot}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
      />

      <aside className="grid items-start gap-4 self-start sm:grid-cols-2 xl:flex xl:h-full xl:flex-col xl:self-stretch">
        <SettingsCard
          title="후원 지갑 요약"
          className="self-start xl:self-stretch"
          contentClassName="gap-4"
        >
          <DonationSummaryGrid snapshot={snapshot} />
        </SettingsCard>

        <SettingsCard
          title={GRAPH_CARD_TITLE[activeTab]}
          className="self-start xl:flex-1 xl:self-stretch"
          contentClassName="gap-4 xl:flex-1"
        >
          <UserDonationDailyChart snapshot={snapshot} activeTab={activeTab} />
        </SettingsCard>
      </aside>
    </section>
  );
}

function DonationSummaryGrid({ snapshot }: { snapshot: UserDonationSnapshot }) {
  const summaryItems = [
    {
      label: "이번 달 후원",
      value: snapshot.stats.currentMonthDonationAmount,
    },
    {
      label: "이번 달 충전",
      value: snapshot.stats.currentMonthChargeAmount,
    },
    {
      label: "총 보낸 후원",
      value: snapshot.stats.totalDonationAmount,
    },
    {
      label: "총 충전 금액",
      value: snapshot.stats.totalChargeAmount,
    },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
      {summaryItems.map((item) => (
        <div key={item.label} className="rounded-lg border px-3 py-3">
          <dt className="text-muted-foreground text-xs font-black">{item.label}</dt>
          <dd className="text-foreground mt-2 text-xl leading-tight font-black">
            {formatPoint(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatPoint(value: number) {
  return `${value.toLocaleString("ko-KR")}P`;
}
