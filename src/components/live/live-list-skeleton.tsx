// 라이브 목록 로딩 상태의 카드 스켈레톤을 렌더링합니다.

import { Skeleton } from "@/components/ui/skeleton";

interface LiveListSkeletonProps {
  count?: number;
}

export default function LiveListSkeleton({ count = 8 }: LiveListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden">
          <Skeleton className="aspect-video rounded-lg" />
          <div className="mt-3 flex gap-2.5">
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
