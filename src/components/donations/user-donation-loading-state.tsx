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
      <section className="from-live via-live/85 to-brand rounded-xl bg-gradient-to-br p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40 bg-white/30" />
            <Skeleton className="mt-4 h-14 w-64 bg-white/30" />
            <div className="mt-5 flex flex-wrap gap-3">
              <Skeleton className="h-5 w-32 bg-white/30" />
              <Skeleton className="h-5 w-32 bg-white/30" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 bg-white/30" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <SettingsCard title="최근 내역">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </SettingsCard>
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SettingsCard title="이번 달 후원">
            <Skeleton className="h-16" />
          </SettingsCard>
          <SettingsCard title="결제 상태">
            <Skeleton className="h-16" />
          </SettingsCard>
        </aside>
      </section>
    </SettingsPage>
  );
}
