// 사용자 후원 지갑 페이지의 전체 레이아웃을 구성합니다.
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { UserDonationHistoryTable } from "@/components/donations/user-donation-history-table";
import { UserDonationPeriodFilter } from "@/components/donations/user-donation-period-filter";
import { UserDonationSummaryCards } from "@/components/donations/user-donation-summary-cards";
import { UserDonationTabs } from "@/components/donations/user-donation-tabs";
import { WalletChargeCard } from "@/components/donations/wallet-charge-card";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import type { UserDonationSnapshot } from "@/types/donations/user-donations";
import { getAppMessage } from "@/utils/common/app-message";

interface Props {
  snapshot: UserDonationSnapshot | null;
  errorCode?: AppMessageCode;
}

const USER_DONATIONS_PAGE_HEADER = {
  kicker: "DONATIONS",
  title: "후원 지갑",
  description: "후원에 사용할 지갑 잔액과 최근 충전, 후원 내역을 확인할 수 있습니다.",
} as const;

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

  return (
    <SettingsPage {...USER_DONATIONS_PAGE_HEADER}>
      <UserDonationSummaryCards summary={snapshot.summary} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <SettingsCard
          title="현재 후원 지갑"
          description="충전된 금액은 라이브 후원에 사용할 수 있습니다."
          className="border-brand/30"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">현재 잔액</p>
              <p className="text-foreground mt-2 text-4xl leading-tight font-black tracking-tight">
                {snapshot.summary.balanceAmount.toLocaleString("ko-KR")}원
              </p>
            </div>
            <UserDonationPeriodFilter />
          </div>
        </SettingsCard>

        <WalletChargeCard customerKey={snapshot.paymentCustomerKey} />
      </section>

      <section className="flex flex-col gap-4">
        <UserDonationTabs />
        <UserDonationHistoryTable snapshot={snapshot} />
      </section>
    </SettingsPage>
  );
}
