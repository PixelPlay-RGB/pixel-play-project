// 팔로잉 채널 목록 로딩 상태의 스켈레톤을 렌더링합니다.

import { Skeleton } from "@/components/ui/skeleton";

interface FollowingChannelListSkeletonProps {
  count?: number;
}

export default function FollowingChannelListSkeleton({
  count = 5,
}: FollowingChannelListSkeletonProps) {
  return (
    <ul className="flex flex-col gap-1" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 px-2 py-2.5 sm:gap-4 sm:px-3">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
