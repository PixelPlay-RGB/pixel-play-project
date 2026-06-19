// 구독 목록 페이지 진입 시 로딩 스켈레톤. 헤더는 실제 텍스트, 탭·구독 카드만 스켈레톤.
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserSubscriptionsLoading() {
  return (
    <SettingsPage
      kicker="정기구독"
      title="구독"
      description="구독 중인 방송인의 배지와 다음 결제일을 확인합니다."
    >
      <SettingsCard contentClassName="gap-6">
        {/* 활성/만료 탭 */}
        <Skeleton className="h-9 w-full rounded-lg sm:w-64" aria-hidden />

        {/* 구독 카드 grid(2열) */}
        <div className="grid gap-4 lg:grid-cols-2" aria-hidden>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="border-border bg-background flex items-center justify-between gap-4 rounded-xl border p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-4">
                <Skeleton className="size-14 shrink-0 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </SettingsCard>
    </SettingsPage>
  );
}
