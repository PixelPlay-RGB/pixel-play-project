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
      <section className="from-live via-live/85 to-brand relative isolate min-h-44 overflow-hidden rounded-xl bg-gradient-to-br px-5 py-7 shadow-sm sm:min-h-48 sm:px-7 sm:py-9">
        <span
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_18%,rgba(0,0,0,0.72)_58%,black_100%)] bg-[length:32px_32px]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,77,74,0.94)_0%,rgba(255,77,74,0.8)_20%,rgba(255,77,74,0.42)_42%,rgba(255,77,74,0)_70%)]"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40 bg-white/30" />
            <Skeleton className="mt-4 h-14 w-64 bg-white/30" />
          </div>
          <Skeleton className="h-10 w-28 bg-white/30" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <SettingsCard contentClassName="gap-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="divide-border divide-y">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="my-4 h-10 first:mt-0 last:mb-0" />
              ))}
            </div>
          </SettingsCard>
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SettingsCard title="후원 지갑 요약" contentClassName="gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-lg" />
              ))}
            </div>
          </SettingsCard>
          <SettingsCard title="전체 그래프" contentClassName="gap-4">
            <Skeleton className="h-56" />
          </SettingsCard>
        </aside>
      </section>
    </SettingsPage>
  );
}
