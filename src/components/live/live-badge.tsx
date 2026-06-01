// 라이브 상태 배지를 렌더링합니다.

import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
}

export default function LiveBadge({ className }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        "bg-live text-live-foreground inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold shadow-sm",
        className,
      )}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-white/85" />
      LIVE
    </span>
  );
}
