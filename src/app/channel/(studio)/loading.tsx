// 채널 관리(studio) 탭 진입/전환 시 공통 로딩 스켈레톤.
// 스튜디오 탭은 동일 ChannelShell 콘텐츠 슬롯을 공유하고 layout은 소프트 내비 시 재실행되지
// 않으므로, 그룹 레벨 loading 하나로 모든 탭의 무거운 스냅샷 RPC pending을 커버한다.
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelStudioLoading() {
  return (
    <div className="mx-auto flex w-full max-w-480 flex-col gap-7" aria-hidden>
      {/* SettingsPage 헤더(kicker + 제목 + 설명) */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* 본문 카드(통계 그리드/표/폼 어디에나 무난한 범용 골격) */}
      {Array.from({ length: 2 }).map((_, cardIndex) => (
        <Card key={cardIndex} className="gap-5 py-6 shadow-sm">
          <CardContent className="flex flex-col gap-5 px-5 sm:px-6">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, itemIndex) => (
                <Skeleton key={itemIndex} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
