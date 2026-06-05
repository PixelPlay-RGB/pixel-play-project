// 게시글 상세 페이지 진입/전환 시 콘텐츠 슬롯 로딩 스켈레톤.
// 상단 툴바 + 게시글 카드 + 댓글 영역 구조를 실제 상세 뷰와 맞춰 레이아웃 시프트를 방지합니다.
import { CommunityCommentListSkeleton } from "@/components/community/community-comment-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <article className="flex flex-col gap-4" aria-hidden>
      {/* 상단 툴바: 목록으로 + 이전/다음글 */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-20" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>

      <div className="border-border/60 bg-card/40 overflow-hidden rounded-2xl border">
        {/* 게시글 */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-4 flex items-center justify-end">
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>

        {/* 댓글 영역 */}
        <section className="border-border/60 border-t p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <CommunityCommentListSkeleton />
          </div>
        </section>
      </div>
    </article>
  );
}
