// 사용자 후원 지갑 페이지의 전체 레이아웃을 구성합니다.
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { PaymentResultToast } from "@/components/donations/payment-result-toast";
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
  paymentResultCode?: AppMessageCode;
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

export function UserDonationsPage({ snapshot, errorCode, paymentResultCode }: Props) {
  if (!snapshot) {
    const message = getAppMessage(errorCode);

    return (
      <SettingsPage {...USER_DONATIONS_PAGE_HEADER}>
        {paymentResultCode ? <PaymentResultToast code={paymentResultCode} /> : null}
        <SettingsCard title={message.title}>
          <p className="text-muted-foreground text-sm">{message.description}</p>
        </SettingsCard>
      </SettingsPage>
    );
  }

  const paymentStatus = getPaymentStatus(snapshot.chargeHistories[0]);

  return (
    <SettingsPage {...USER_DONATIONS_PAGE_HEADER}>
      <DonationBalanceHero snapshot={snapshot} />
      {paymentResultCode ? <PaymentResultToast code={paymentResultCode} /> : null}

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <UserDonationHistoryTable snapshot={snapshot} />

        <aside className="grid gap-4 self-start sm:grid-cols-2 xl:grid-cols-1">
          <SettingsCard title="후원 지갑 요약" contentClassName="gap-4">
            <DonationSummaryGrid snapshot={snapshot} />
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

function DonationBalanceHero({ snapshot }: { snapshot: UserDonationSnapshot }) {
  return (
    <section className="from-live via-live/85 to-brand rounded-xl bg-gradient-to-br p-5 text-white shadow-sm sm:p-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black tracking-wide uppercase">
            <span className="size-2 shrink-0 rotate-45 bg-white" aria-hidden />
            <span>DONATION POINT</span>
          </div>
          <p className="mt-4 text-5xl leading-none font-black tracking-tight sm:text-6xl">
            {formatPoint(snapshot.summary.balanceAmount)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <WalletChargeDialog customerKey={snapshot.paymentCustomerKey} />
        </div>
      </div>
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

function getPaymentStatus(latestCharge: UserWalletChargeHistoryItem | undefined) {
  if (!latestCharge) {
    return {
      label: "대기",
      description: "아직 충전 결제 내역이 없습니다.",
    };
  }

  return PAYMENT_STATUS_SUMMARY[latestCharge.status];
}

function formatPoint(value: number) {
  return `${value.toLocaleString("ko-KR")}P`;
}
