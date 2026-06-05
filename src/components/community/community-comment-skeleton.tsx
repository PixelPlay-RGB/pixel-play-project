// 댓글/대댓글 로딩 스켈레톤. 실제 댓글 아이템 구조·높이를 맞춰 레이아웃 시프트를 방지합니다.
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CommunityCommentItemSkeleton({ isReply = false }: { isReply?: boolean }) {
  return (
    <div className={cn("flex gap-3", isReply ? "py-2" : "py-3")} aria-hidden>
      <Skeleton className={cn("shrink-0 rounded-full", isReply ? "size-8" : "size-9")} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
        <div className="mt-1.5 flex h-7 items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

export function CommunityCommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="divide-border/60 divide-y">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <CommunityCommentItemSkeleton />
        </li>
      ))}
    </ul>
  );
}
