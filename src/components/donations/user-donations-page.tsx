// 사용자 후원 지갑 페이지의 전체 레이아웃을 구성합니다.
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { PaymentResultToast } from "@/components/donations/payment-result-toast";
import { UserDonationHistoryTable } from "@/components/donations/user-donation-history-table";
import { WalletChargeDialog } from "@/components/donations/wallet-charge-card";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { cn } from "@/lib/utils";
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

const CHARGE_GRAPH_STATUS_STYLE: Record<
  WalletTransactionStatus,
  { label: string; barClassName: string; dotClassName: string }
> = {
  pending: {
    label: "승인 대기",
    barClassName: "bg-amber-400",
    dotClassName: "bg-amber-400",
  },
  succeeded: {
    label: "승인 완료",
    barClassName: "bg-brand",
    dotClassName: "bg-brand",
  },
  failed: {
    label: "승인 실패",
    barClassName: "bg-live",
    dotClassName: "bg-live",
  },
  canceled: {
    label: "승인 취소",
    barClassName: "bg-muted-foreground/50",
    dotClassName: "bg-muted-foreground/50",
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

  return (
    <SettingsPage {...USER_DONATIONS_PAGE_HEADER}>
      <DonationBalanceHero snapshot={snapshot} />
      {paymentResultCode ? <PaymentResultToast code={paymentResultCode} /> : null}

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <UserDonationHistoryTable snapshot={snapshot} />

        <aside className="grid items-start gap-4 self-start sm:grid-cols-2 xl:grid-cols-1">
          <SettingsCard title="후원 지갑 요약" className="self-start" contentClassName="gap-4">
            <DonationSummaryGrid snapshot={snapshot} />
          </SettingsCard>

          <SettingsCard title="결제 내역 그래프" className="self-start" contentClassName="gap-4">
            <ChargeHistoryGraph snapshot={snapshot} />
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

function ChargeHistoryGraph({ snapshot }: { snapshot: UserDonationSnapshot }) {
  const periodLabel = formatHistoryPeriod(snapshot);
  const chargeHistories = [...snapshot.chargeHistories].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  if (chargeHistories.length === 0) {
    return (
      <div className="border-border bg-muted/20 flex min-h-44 flex-col justify-center gap-2 rounded-lg border border-dashed p-4">
        <p className="text-foreground text-sm font-black">선택한 달의 결제 내역 없음</p>
        <p className="text-muted-foreground text-xs">
          {periodLabel}에 표시할 충전 결제 내역이 없습니다.
        </p>
      </div>
    );
  }

  const maxAmount = Math.max(...chargeHistories.map((charge) => charge.amount), 1);
  const succeededAmount = chargeHistories.reduce(
    (total, charge) => (charge.status === "succeeded" ? total + charge.amount : total),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-black">{periodLabel} 승인 완료 충전</p>
          <p className="text-foreground mt-1 text-2xl leading-tight font-black">
            {formatPoint(succeededAmount)}
          </p>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs font-semibold">
          {chargeHistories.length}건
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="border-border bg-muted/20 flex h-36 min-w-full items-end gap-2 rounded-lg border px-3 py-3"
          role="img"
          aria-label={`${periodLabel} 충전 결제 내역 그래프`}
        >
          {chargeHistories.map((charge) => (
            <ChargeHistoryBar key={charge.id} charge={charge} maxAmount={maxAmount} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {Object.values(CHARGE_GRAPH_STATUS_STYLE).map((status) => (
          <span
            key={status.label}
            className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold"
          >
            <span className={cn("size-2 rounded-full", status.dotClassName)} aria-hidden />
            {status.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChargeHistoryBar({
  charge,
  maxAmount,
}: {
  charge: UserWalletChargeHistoryItem;
  maxAmount: number;
}) {
  const statusStyle = CHARGE_GRAPH_STATUS_STYLE[charge.status];
  const height = `${Math.max(10, Math.round((charge.amount / maxAmount) * 100))}%`;
  const description = `${formatKstMonthDay(charge.createdAt)} ${formatPoint(charge.amount)} ${statusStyle.label}`;

  return (
    <div className="flex h-full w-10 shrink-0 flex-col items-center justify-end gap-2">
      <div className="bg-background flex h-full w-full items-end rounded-md border px-1 pt-1">
        <div
          className={cn("w-full rounded-t-sm", statusStyle.barClassName)}
          style={{ height }}
          title={description}
          aria-label={description}
        />
      </div>
      <span className="text-muted-foreground text-xs font-semibold">
        {formatKstDay(charge.createdAt)}
      </span>
    </div>
  );
}

function formatHistoryPeriod(snapshot: UserDonationSnapshot) {
  return `${snapshot.historyPeriod.year}년 ${snapshot.historyPeriod.month}월`;
}

function formatPoint(value: number) {
  return `${value.toLocaleString("ko-KR")}P`;
}

function formatKstDay(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    day: "numeric",
  }).format(new Date(value));
}

function formatKstMonthDay(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}
