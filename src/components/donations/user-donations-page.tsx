// 사용자 후원 지갑 페이지의 전체 레이아웃을 구성합니다.
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { UserDonationHistoryTable } from "@/components/donations/user-donation-history-table";
import { WalletChargeDialog } from "@/components/donations/wallet-charge-card";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import type {
  UserDonationSnapshot,
  UserWalletChargeHistoryItem,
  WalletTransactionStatus,
} from "@/types/donations/user-donations";
import { getAppMessage } from "@/utils/common/app-message";

interface Props {
  snapshot: UserDonationSnapshot | null;
  errorCode?: AppMessageCode;
}

interface MonthlyDonationStats {
  chargeAmount: number;
  donationAmount: number;
  donationCount: number;
}

const USER_DONATIONS_PAGE_HEADER = {
  kicker: "DONATIONS",
  title: "후원 지갑",
  description: "방송 후원에 사용할 포인트 잔액과 충전, 후원 내역을 확인합니다.",
} as const;

const PAYMENT_STATUS_SUMMARY: Record<
  WalletTransactionStatus,
  { label: string; description: string }
> = {
  pending: {
    label: "확인 중",
    description: "최근 충전 결제 승인을 기다리고 있습니다.",
  },
  succeeded: {
    label: "정상",
    description: "최근 결제 승인 완료.",
  },
  failed: {
    label: "확인 필요",
    description: "최근 결제가 실패했습니다.",
  },
  canceled: {
    label: "취소",
    description: "최근 결제가 취소되었습니다.",
  },
};

export function UserDonationsPage({ snapshot, errorCode }: Props) {
  if (!snapshot) {
    const message = getAppMessage(errorCode);

    return (
      <SettingsPage {...USER_DONATIONS_PAGE_HEADER}>
        <SettingsCard title={message.title}>
          <p className="text-muted-foreground text-sm">{message.description}</p>
        </SettingsCard>
      </SettingsPage>
    );
  }

  const monthlyStats = getMonthlyDonationStats(snapshot);
  const paymentStatus = getPaymentStatus(snapshot.chargeHistories[0]);

  return (
    <SettingsPage {...USER_DONATIONS_PAGE_HEADER}>
      <DonationBalanceHero snapshot={snapshot} monthlyStats={monthlyStats} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <UserDonationHistoryTable snapshot={snapshot} />

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SettingsCard title="이번 달 후원" contentClassName="gap-2">
            <p className="text-foreground text-3xl leading-tight font-black">
              {formatPoint(monthlyStats.donationAmount)}
            </p>
            <p className="text-muted-foreground text-sm">
              총 {monthlyStats.donationCount.toLocaleString("ko-KR")}회 보냈습니다.
            </p>
          </SettingsCard>

          <SettingsCard title="결제 상태" contentClassName="gap-2">
            <p className="text-foreground text-3xl leading-tight font-black">
              {paymentStatus.label}
            </p>
            <p className="text-muted-foreground text-sm">{paymentStatus.description}</p>
          </SettingsCard>
        </aside>
      </section>
    </SettingsPage>
  );
}

function DonationBalanceHero({
  snapshot,
  monthlyStats,
}: {
  snapshot: UserDonationSnapshot;
  monthlyStats: MonthlyDonationStats;
}) {
  return (
    <section className="from-live via-live/85 to-brand rounded-xl bg-gradient-to-br p-5 text-white shadow-sm sm:p-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black tracking-wide uppercase">
            <span className="size-2 shrink-0 rotate-45 bg-white" aria-hidden />
            <span>DONATION BALANCE</span>
          </div>
          <p className="mt-4 text-5xl leading-none font-black tracking-tight sm:text-6xl">
            {formatPoint(snapshot.summary.balanceAmount)}
          </p>
          <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-black text-white/90">
            <div className="flex items-center gap-1.5">
              <dt>이번 달 충전</dt>
              <dd>{formatPoint(monthlyStats.chargeAmount)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt>보낸 후원</dt>
              <dd>{formatPoint(monthlyStats.donationAmount)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <WalletChargeDialog customerKey={snapshot.paymentCustomerKey} />
          <span className="bg-brand/25 text-brand-foreground flex h-10 items-center rounded-full px-4 text-xs font-black ring-1 ring-white/10">
            포인트 사용 가능
          </span>
        </div>
      </div>
    </section>
  );
}

function getMonthlyDonationStats(snapshot: UserDonationSnapshot): MonthlyDonationStats {
  const donationAmount = snapshot.sentDonations
    .filter((donation) => isCurrentKstMonth(donation.createdAt))
    .reduce((total, donation) => total + donation.amount, 0);
  const chargeAmount = snapshot.chargeHistories
    .filter((charge) => charge.status === "succeeded" && isCurrentKstMonth(charge.createdAt))
    .reduce((total, charge) => total + charge.amount, 0);

  return {
    chargeAmount,
    donationAmount,
    donationCount: snapshot.sentDonations.filter((donation) =>
      isCurrentKstMonth(donation.createdAt),
    ).length,
  };
}

function getPaymentStatus(latestCharge: UserWalletChargeHistoryItem | undefined) {
  if (!latestCharge) {
    return {
      label: "대기",
      description: "아직 충전 결제 내역이 없습니다.",
    };
  }

  return PAYMENT_STATUS_SUMMARY[latestCharge.status];
}

function isCurrentKstMonth(value: string) {
  return getKstMonthKey(value) === getKstMonthKey(new Date().toISOString());
}

function getKstMonthKey(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(new Date(value));
}

function formatPoint(value: number) {
  return `${value.toLocaleString("ko-KR")}P`;
}
