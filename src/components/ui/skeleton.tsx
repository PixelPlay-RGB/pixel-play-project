// 로딩 중 콘텐츠 자리를 잡아주는 스켈레톤. 데이터가 도착하면 즉시 교체된다.
// 인위적 지연 없이 곧바로 표시한다 — 로딩이 빠르면 잠깐 보였다 사라지는 게 정직하고 예측 가능하다.

import { cn } from "@/lib/utils/index";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
