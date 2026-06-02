// 사용자 후원 지갑 페이지의 전체 레이아웃을 구성합니다.
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { UserDonationHistoryTable } from "@/components/donations/user-donation-history-table";
import { UserDonationPeriodFilter } from "@/components/donations/user-donation-period-filter";
import { UserDonationSummaryCards } from "@/components/donations/user-donation-summary-cards";
import { UserDonationTabs } from "@/components/donations/user-donation-tabs";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import type { UserDonationSnapshot } from "@/types/donations/user-donations";
import { getAppMessage } from "@/utils/common/app-message";

interface Props {
  snapshot: UserDonationSnapshot | null;
  errorCode?: AppMessageCode;
}

const USER_DONATIONS_PAGE_HEADER = {
  kicker: "후원 지갑",
  title: "포인트 내역을 확인해요",
  description: "후원에 사용한 포인트와 충전 내역, 무료 지급 내역을 월별로 확인할 수 있습니다.",
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

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <UserDonationTabs filter={snapshot.filter} />
          <UserDonationPeriodFilter filter={snapshot.filter} />
        </div>

        <UserDonationHistoryTable snapshot={snapshot} />
      </section>
    </SettingsPage>
  );
}
