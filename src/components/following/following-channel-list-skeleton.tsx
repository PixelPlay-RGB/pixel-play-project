// 팔로잉 채널 목록 로딩 상태의 스켈레톤을 렌더링합니다.

import { Skeleton } from "@/components/ui/skeleton";

interface FollowingChannelListSkeletonProps {
  count?: number;
}

export default function FollowingChannelListSkeleton({
  count = 6,
}: FollowingChannelListSkeletonProps) {
  return (
    <ul className="space-y-2.5" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="ring-foreground/10 flex items-center gap-3 rounded-xl px-3 py-3 ring-1 sm:gap-4 sm:px-4"
        >
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
