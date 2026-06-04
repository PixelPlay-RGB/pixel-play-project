// 사용자 후원 지갑 화면의 로딩 상태를 표시합니다.
import { SettingsPage } from "@/components/common/settings-page";
import { SettingsCard } from "@/components/common/settings-card";
import { Skeleton } from "@/components/ui/skeleton";

export function UserDonationLoadingState() {
  return (
    <SettingsPage
      kicker="DONATIONS"
      title="후원 지갑"
      description="후원 지갑 정보를 불러오는 중입니다."
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-30" />
        <Skeleton className="h-30" />
        <Skeleton className="h-30" />
        <Skeleton className="h-30" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <SettingsCard title="현재 후원 지갑" description=" ">
          <Skeleton className="h-20" />
        </SettingsCard>
        <SettingsCard title="지갑 충전" description=" ">
          <Skeleton className="h-36" />
        </SettingsCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SettingsCard title="최근 지갑 거래" description=" ">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </SettingsCard>
        <SettingsCard title="보낸 후원" description=" ">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </SettingsCard>
      </section>
    </SettingsPage>
  );
}
