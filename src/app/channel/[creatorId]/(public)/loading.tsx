// 채널 홈 탭 진입/전환 시 콘텐츠 로딩 스켈레톤 (Live Hero + 배너 줄 + 커뮤니티 미리보기).
// 프로필 헤더·탭은 (public) layout이 담당해 유지되고, 콘텐츠 슬롯만 스켈레톤으로 채운다.
import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelHomeLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      {/* Live Hero */}
      <Skeleton className="h-40 w-full rounded-2xl sm:h-52" />

      {/* 배너 줄 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[3/1] w-full rounded-xl" />
        ))}
      </div>

      {/* 커뮤니티 미리보기 */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
