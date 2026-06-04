// 사용자 후원 지갑의 후원 내역과 충전 내역을 표시합니다.
import { SettingsCard } from "@/components/common/settings-card";
import type {
  UserDonationSnapshot,
  UserSentDonationItem,
  UserWalletChargeHistoryItem,
  WalletTransactionStatus,
} from "@/types/donations/user-donations";
import { CircleDollarSign, CreditCard, Gift } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  snapshot: UserDonationSnapshot;
}

const TRANSACTION_STATUS_LABEL: Record<WalletTransactionStatus, string> = {
  pending: "대기",
  succeeded: "완료",
  failed: "실패",
  canceled: "취소",
};

export function UserDonationHistoryTable({ snapshot }: Props) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <SettingsCard title="후원 내역" description="방송에서 보낸 후원 내역입니다.">
        <SentDonationList donations={snapshot.sentDonations} />
      </SettingsCard>

      <SettingsCard title="충전 내역" description="후원 지갑에 충전한 내역입니다.">
        <ChargeHistoryList charges={snapshot.chargeHistories} />
      </SettingsCard>
    </section>
  );
}

function ChargeHistoryList({ charges }: { charges: UserWalletChargeHistoryItem[] }) {
  if (charges.length === 0) {
    return (
      <EmptyList
        icon={<CreditCard className="size-5" />}
        title="충전 내역 없음"
        description="후원 지갑을 충전하면 여기에 표시됩니다."
      />
    );
  }

  return (
    <ul className="divide-border divide-y">
      {charges.map((charge) => (
        <li
          key={charge.id}
          className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-brand/10 text-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
              <CreditCard className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-foreground text-sm font-semibold">지갑 충전</p>
                <span className="text-muted-foreground rounded-md border px-2 py-0.5 text-xs">
                  {TRANSACTION_STATUS_LABEL[charge.status]}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatKstDateTime(charge.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-foreground text-sm font-bold">{formatWon(charge.amount)}</p>
            {charge.balanceAfter !== null && (
              <p className="text-muted-foreground mt-1 text-xs">
                잔액 {formatWon(charge.balanceAfter)}
              </p>
            )}
          </div>
        </li>
      ))}
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
