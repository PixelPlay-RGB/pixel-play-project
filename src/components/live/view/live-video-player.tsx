// 16:9 mock 플레이어 — LIVE 배지, 시청자 수, 컨트롤을 렌더링합니다.

import { Play, Radio, Users } from "lucide-react";
import { LivePlayerControls } from "@/components/live/view/live-player-controls";
import { LIVE_LABEL } from "@/constants/live/live";
import { formatViewerCount } from "@/utils/live/live-chat";
import { cn } from "@/lib/utils";
import type { LiveBroadcast } from "@/types/live/live";

interface Props {
  broadcast: LiveBroadcast;
}

export function LiveVideoPlayer({ broadcast }: Props) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl",
        "bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900",
      )}
    >
      {/* 상단 오버레이 */}
      <div className="absolute top-0 left-0 z-10 flex items-center gap-2 px-4 pt-4">
        <span className="bg-live flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white">
          <Radio className="size-3" />
          {LIVE_LABEL.live}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Users className="size-3" />
          {formatViewerCount(broadcast.viewerCount)}
        </span>
      </div>

      {/* 중앙 재생 버튼 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-sm sm:size-20">
          <Play className="size-7 fill-white text-white sm:size-9" />
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="absolute right-0 bottom-0 left-0 z-10 bg-linear-to-t from-black/60 to-transparent px-4 pt-8 pb-4">
        <LivePlayerControls />
      </div>
    </div>
  );
}
