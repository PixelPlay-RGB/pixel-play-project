// 후원 현황 요약(이번 달 수익·후원 수·정산 상태)을 상단 통계 카드로 보여줍니다.

import { CalendarHeart, Coins, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DonationSettlementDemo, MonthlyDonationStat } from "@/types/channel/donation";
import { formatPoint } from "@/utils/channel/donation-format";

interface Props {
  monthlyDonation: MonthlyDonationStat;
  settlement: DonationSettlementDemo;
}

const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  ready: "정산 가능",
  pending: "정산 대기",
  processing: "정산 중",
  done: "정산 완료",
};

export default function DonationStatsSummary({ monthlyDonation, settlement }: Props) {
  const statusLabel = SETTLEMENT_STATUS_LABEL[settlement.status] ?? "정산 대기";

  const stats = [
    {
      icon: Coins,
      label: "이번 달 후원 수익",
      value: formatPoint(monthlyDonation.amountTotal),
      sub: null as string | null,
      isLiveAccent: false,
    },
    {
      icon: CalendarHeart,
      label: "이번 달 후원 수",
      value: `${monthlyDonation.donationCount}건`,
      sub: null,
      isLiveAccent: false,
    },
    {
      icon: Wallet,
      label: "정산 상태",
      value: statusLabel,
      sub: `정산 예정 ${formatPoint(settlement.totalAmount)}`,
      isLiveAccent: true,
    },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="bg-card ring-foreground/10 flex items-center gap-3 rounded-xl px-4 py-3.5 ring-1"
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                stat.isLiveAccent ? "bg-live/10 text-live" : "bg-brand/10 text-brand",
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <dt className="text-muted-foreground truncate text-xs font-medium">{stat.label}</dt>
              <dd className="text-foreground truncate text-lg font-black">{stat.value}</dd>
              {stat.sub && (
                <span className="text-muted-foreground truncate text-xs">{stat.sub}</span>
              )}
            </div>
          </div>
        );
      })}
    </dl>
  );
}
