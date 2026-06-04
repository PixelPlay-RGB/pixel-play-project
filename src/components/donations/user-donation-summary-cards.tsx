// 사용자 후원 지갑의 잔액과 최근 요약을 표시합니다.
import type { UserDonationSummary } from "@/types/donations/user-donations";
import { CircleDollarSign, CreditCard, ReceiptText, WalletCards } from "lucide-react";

interface Props {
  summary: UserDonationSummary;
}

export function UserDonationSummaryCards({ summary }: Props) {
  const items = [
    {
      label: "보유 잔액",
      value: formatWon(summary.balanceAmount),
      icon: WalletCards,
    },
    {
      label: "최근 후원",
      value: formatWon(summary.sentDonationAmount),
      icon: CircleDollarSign,
    },
    {
      label: "최근 충전",
      value: formatWon(summary.chargeAmount),
      icon: CreditCard,
    },
    {
      label: "최근 거래",
      value: `${summary.transactionCount}건`,
      icon: ReceiptText,
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
            <strong className="text-foreground text-2xl font-black break-words tabular-nums">
              {item.value}
            </strong>
          </div>
        );
      })}
    </section>
  );
}

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}
