// 사용자 후원 지갑의 최근 거래와 보낸 후원 내역을 표시합니다.
import { SettingsCard } from "@/components/common/settings-card";
import type {
  UserDonationSnapshot,
  UserSentDonationItem,
  UserWalletTransactionItem,
  WalletTransactionStatus,
  WalletTransactionType,
} from "@/types/donations/user-donations";
import { CircleDollarSign, CreditCard, Gift, ReceiptText, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  snapshot: UserDonationSnapshot;
}

const TRANSACTION_TYPE_LABEL: Record<WalletTransactionType, string> = {
  charge: "지갑 충전",
  donation_spend: "보낸 후원",
  refund: "환불",
};

const TRANSACTION_STATUS_LABEL: Record<WalletTransactionStatus, string> = {
  pending: "대기",
  succeeded: "완료",
  failed: "실패",
  canceled: "취소",
};

const TRANSACTION_TYPE_ICON: Record<WalletTransactionType, LucideIcon> = {
  charge: CreditCard,
  donation_spend: Gift,
  refund: RotateCcw,
};

export function UserDonationHistoryTable({ snapshot }: Props) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <SettingsCard
        title="최근 지갑 거래"
        description="충전, 보낸 후원, 환불로 발생한 잔액 변동을 최신순으로 표시합니다."
      >
        <TransactionList transactions={snapshot.transactions} />
      </SettingsCard>

      <SettingsCard title="보낸 후원" description="라이브에서 보낸 후원 내역입니다.">
        <SentDonationList donations={snapshot.sentDonations} />
      </SettingsCard>
    </section>
  );
}

function TransactionList({ transactions }: { transactions: UserWalletTransactionItem[] }) {
  if (transactions.length === 0) {
    return (
      <EmptyList
        icon={<ReceiptText className="size-5" />}
        title="거래 내역 없음"
        description="지갑 충전이나 후원이 발생하면 여기에 표시됩니다."
      />
    );
  }

  return (
    <ul className="divide-border divide-y">
      {transactions.map((transaction) => {
        const TransactionIcon = TRANSACTION_TYPE_ICON[transaction.type];

        return (
          <li
            key={transaction.id}
            className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                <TransactionIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-foreground text-sm font-semibold">
                    {TRANSACTION_TYPE_LABEL[transaction.type]}
                  </p>
                  <span className="text-muted-foreground rounded-md border px-2 py-0.5 text-xs">
                    {TRANSACTION_STATUS_LABEL[transaction.status]}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatKstDateTime(transaction.createdAt)}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-foreground text-sm font-bold">
                {formatSignedWon(transaction.amountDelta)}
              </p>
              {transaction.balanceAfter !== null && (
                <p className="text-muted-foreground mt-1 text-xs">
                  잔액 {formatWon(transaction.balanceAfter)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SentDonationList({ donations }: { donations: UserSentDonationItem[] }) {
  if (donations.length === 0) {
    return (
      <EmptyList
        icon={<Gift className="size-5" />}
        title="보낸 후원 없음"
        description="라이브에서 후원을 보내면 여기에 표시됩니다."
      />
    );
  }

  return (
    <ul className="divide-border divide-y">
      {donations.map((donation) => (
        <li
          key={donation.id}
          className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-live/10 text-live flex size-10 shrink-0 items-center justify-center rounded-lg">
                <CircleDollarSign className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-semibold">
                  {donation.creatorNickname}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatKstDateTime(donation.createdAt)}
                </p>
              </div>
            </div>
            {donation.message && (
              <p className="text-muted-foreground mt-3 text-sm break-words">{donation.message}</p>
            )}
          </div>
          <p className="text-foreground shrink-0 text-sm font-bold">{formatWon(donation.amount)}</p>
        </li>
      ))}
    </ul>
  );
}

function EmptyList({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-border bg-muted/20 flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
      <div className="bg-background text-muted-foreground flex size-10 items-center justify-center rounded-lg border">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </div>
  );
}

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatSignedWon(value: number) {
  const sign = value > 0 ? "+" : "";

  return `${sign}${formatWon(value)}`;
}

function formatKstDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
