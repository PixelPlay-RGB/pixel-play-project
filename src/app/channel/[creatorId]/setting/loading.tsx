// 채널 관리(설정) 페이지 진입 시 로딩 스켈레톤. 헤더는 실제 텍스트, 본문 카드만 스켈레톤.
import { SettingsPage } from "@/components/common/settings-page";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelSettingLoading() {
  return (
    <SettingsPage
      kicker="채널 관리"
      title="내 채널을 꾸며요"
      description="공개 프로필과 채널 소개, 홈 배너를 설정해 방문자에게 보여줄 채널을 완성해요."
    >
      <Card className="gap-0 py-0 shadow-sm" aria-hidden>
        {/* 공개 프로필 */}
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <Skeleton className="h-5 w-24" />
          <div className="flex items-center gap-5">
            <Skeleton className="size-20 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
        {/* 채널 소개 */}
        <div className="border-border/60 flex flex-col gap-5 border-t p-5 sm:p-6">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        {/* 홈 배너 */}
        <div className="border-border/60 flex flex-col gap-5 border-t p-5 sm:p-6">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </Card>
    </SettingsPage>
  );
}
