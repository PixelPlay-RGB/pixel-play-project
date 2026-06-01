// 팔로잉 채널 행의 라이브/오프라인 상태 표시를 렌더링합니다.

import { Eye } from "lucide-react";

import type { FollowingChannelPageItem } from "@/types/following/following-page";
import { formatLastBroadcastLabel } from "@/utils/following/following-format";
import { formatViewerCountNumber } from "@/utils/live/live-list";

interface FollowingLiveStatusProps {
  item: FollowingChannelPageItem;
}

export default function FollowingLiveStatus({ item }: FollowingLiveStatusProps) {
  if (item.isLive) {
    return (
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        <Eye className="text-live size-3.5 shrink-0" aria-hidden />
        <span className="text-foreground font-semibold">
          {formatViewerCountNumber(item.currentViewerCount)}명
        </span>
        <span className="text-muted-foreground min-w-0 truncate font-medium">
          시청 중{item.liveTitle ? ` · ${item.liveTitle}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
      <span className="bg-muted-foreground/40 size-1.5 shrink-0 rounded-full" aria-hidden />
      <span className="truncate">오프라인 · {formatLastBroadcastLabel(item.lastBroadcastAt)}</span>
    </div>
  );
}
