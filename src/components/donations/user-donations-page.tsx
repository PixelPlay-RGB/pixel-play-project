// 사용자 후원 지갑 페이지의 전체 레이아웃을 구성합니다.
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { PaymentResultToast } from "@/components/donations/payment-result-toast";
import { UserDonationDashboardSection } from "@/components/donations/user-donation-dashboard-section";
import { WalletChargeDialog } from "@/components/donations/wallet-charge-card";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import type { UserDonationSnapshot } from "@/types/donations/user-donations";
import { getAppMessage } from "@/utils/common/app-message";
import { formatPoint } from "@/utils/donations/format";

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

      <UserDonationDashboardSection snapshot={snapshot} />
    </SettingsPage>
  );
}

function DonationBalanceHero({ snapshot }: { snapshot: UserDonationSnapshot }) {
  return (
    <section className="from-live via-live/85 to-brand relative isolate min-h-44 overflow-hidden rounded-xl bg-gradient-to-br px-5 py-7 text-white shadow-sm sm:min-h-48 sm:px-7 sm:py-9">
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_18%,rgba(0,0,0,0.72)_58%,black_100%)] bg-[length:32px_32px]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,77,74,0.94)_0%,rgba(255,77,74,0.8)_20%,rgba(255,77,74,0.42)_42%,rgba(255,77,74,0)_70%)]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
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
