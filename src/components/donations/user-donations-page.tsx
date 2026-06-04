// 사용자 후원 지갑 페이지의 전체 레이아웃을 구성합니다.
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { UserDonationHistoryTable } from "@/components/donations/user-donation-history-table";
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
  description: "방송 후원에 사용할 충전 잔액과 후원, 충전 내역을 확인합니다.",
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
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <SettingsCard
          title="현재 충전 잔액"
          description="충전된 금액은 라이브 후원에 사용할 수 있습니다."
          className="border-brand/30"
        >
          <div>
            <p className="text-muted-foreground text-sm">후원 가능 잔액</p>
            <p className="text-foreground mt-2 text-4xl leading-tight font-black tracking-tight">
              {snapshot.summary.balanceAmount.toLocaleString("ko-KR")}원
            </p>
          </div>
        </SettingsCard>

        <WalletChargeCard customerKey={snapshot.paymentCustomerKey} />
      </section>

      <UserDonationHistoryTable snapshot={snapshot} />
    </SettingsPage>
  );
}
