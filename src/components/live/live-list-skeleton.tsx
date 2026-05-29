// 라이브 목록 로딩 상태의 카드 스켈레톤을 렌더링합니다.

import { Skeleton } from "@/components/ui/skeleton";

interface LiveListSkeletonProps {
  count?: number;
}

export default function LiveListSkeleton({ count = 8 }: LiveListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-card overflow-hidden rounded-lg border shadow-sm">
          <Skeleton className="aspect-video rounded-none" />
          <div className="flex gap-3 p-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
