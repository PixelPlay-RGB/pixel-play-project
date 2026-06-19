// 채널 클립 탭 진입/전환 시 로딩 스켈레톤 (기간·정렬 툴바 + 세로 카드 그리드).
// ClipChannelGrid의 그리드 레이아웃·기본 페이지 크기와 동일하게 맞춰 레이아웃 시프트를 줄인다.
import { Skeleton } from "@/components/ui/skeleton";
import { CLIP_CHANNEL_PAGE_SIZE } from "@/constants/clip/clip";

const GRID_CLASS = "grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export default function ChannelClipLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-4" aria-hidden>
      {/* 기간 필터 + 정렬 툴바 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-9 w-56 max-w-full rounded-full" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* 세로 카드 그리드 */}
      <div className={GRID_CLASS}>
        {Array.from({ length: CLIP_CHANNEL_PAGE_SIZE }).map((_, index) => (
          <Skeleton key={index} className="aspect-[9/16] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
