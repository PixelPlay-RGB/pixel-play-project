// 사용자 후원 지갑의 잔액과 월별 요약을 표시합니다.
import { Button } from "@/components/ui/button";
import type { UserDonationSummary } from "@/types/donations/user-donations";
import { Coins, CreditCard, Gift, WalletCards } from "lucide-react";

interface Props {
  summary: UserDonationSummary;
}

export function UserDonationSummaryCards({ summary }: Props) {
  const items = [
    {
      label: "보유 포인트",
      value: summary.balanceAmount,
      icon: WalletCards,
    },
    {
      label: "이번 달 사용",
      value: summary.monthlyUsageAmount,
      icon: Coins,
    },
    {
      label: "이번 달 구매",
      value: summary.monthlyPurchaseAmount,
      icon: CreditCard,
    },
    {
      label: "이번 달 무료 지급",
      value: summary.monthlyFreeAmount,
      icon: Gift,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="border-border bg-card flex min-h-30 flex-col justify-between rounded-lg border p-5 shadow-sm"
          >
            <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm font-semibold">
              <span>{item.label}</span>
              <Icon className="text-brand size-5" />
            </div>
            <strong className="text-foreground text-2xl font-black tabular-nums">
              {formatPointAmount(item.value)}
            </strong>
          </div>
        );
      })}

      <div className="border-brand/25 bg-brand/5 flex min-h-30 flex-col justify-between rounded-lg border p-5 md:col-span-2 xl:col-span-4">
        <div className="flex flex-col gap-1">
          <span className="text-brand text-sm font-bold">포인트 충전</span>
          <p className="text-muted-foreground text-sm">
            결제 연동 API가 완료되면 이 화면에서 바로 포인트를 충전할 수 있습니다.
          </p>
        </div>
        <Button type="button" disabled className="mt-4 w-full sm:w-fit">
          <CreditCard className="size-4" />
          충전 준비 중
        </Button>
      </div>
    </section>
  );
}

function formatPointAmount(value: number) {
  return `${value.toLocaleString("ko-KR")} P`;
}
