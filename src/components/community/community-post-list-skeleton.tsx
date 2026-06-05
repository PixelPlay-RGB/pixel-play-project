// 커뮤니티 게시글 목록 로딩 스켈레톤. 카드 구조/간격을 실제 목록과 맞춰 레이아웃 시프트를 방지합니다.
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  count?: number;
}

export default function CommunityPostListSkeleton({ count = 3 }: Props) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-border/60 bg-card/60 rounded-2xl border p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <div className="mt-3 flex items-center justify-end gap-4">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
