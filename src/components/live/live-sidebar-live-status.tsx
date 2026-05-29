// 라이브 Sidebar 채널 항목의 상태 칩을 렌더링합니다.

import { cn } from "@/lib/utils";
import { formatViewerCountNumber } from "@/utils/live/live-list";

interface LiveSidebarLiveStatusProps {
  isLive: boolean;
  viewerCount?: number;
}

export default function LiveSidebarLiveStatus({
  isLive,
  viewerCount = 0,
}: LiveSidebarLiveStatusProps) {
  const viewerCountLabel = formatViewerCountNumber(viewerCount);

  return (
    <span
      className={cn(
        "ml-auto inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-bold",
        isLive
          ? "border-live/20 bg-live/10 text-live"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
      aria-label={isLive ? `라이브 중, ${viewerCountLabel}명 시청 중` : "쉬는 중"}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          isLive ? "bg-live ring-live/20 ring-2" : "bg-muted-foreground/50",
        )}
        aria-hidden
      />
      <span>{isLive ? viewerCountLabel : "쉬는 중"}</span>
    </span>
  );
}
