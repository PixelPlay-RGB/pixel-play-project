// 팔로잉 채널 카드의 라이브/오프라인 상태 표시를 렌더링합니다.

import LiveBadge from "@/components/live/live-badge";
import type { FollowingChannelPageItem } from "@/types/following/following-page";
import { formatLastBroadcastLabel } from "@/utils/following/following-format";
import { formatViewerCountNumber } from "@/utils/live/live-list";

interface FollowingLiveStatusProps {
  item: FollowingChannelPageItem;
}

export default function FollowingLiveStatus({ item }: FollowingLiveStatusProps) {
  if (item.isLive) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <LiveBadge />
        <span className="text-muted-foreground min-w-0 truncate text-xs font-medium">
          {formatViewerCountNumber(item.currentViewerCount)}명 시청 중
          {item.liveTitle ? ` · ${item.liveTitle}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
      <span className="bg-muted-foreground/40 size-1.5 shrink-0 rounded-full" aria-hidden />
      <span className="shrink-0">오프라인</span>
      <span aria-hidden>·</span>
      <span className="truncate">{formatLastBroadcastLabel(item.lastBroadcastAt)}</span>
    </div>
  );
}
