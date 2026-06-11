// 점멸 LIVE 인디케이터 — 플레이어 컨트롤 바와 미니플레이어가 공유합니다(점멸 정책·색을 한 곳에서 관리).

import { Radio } from "lucide-react";

import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function LivePlayerLiveIndicator({ className }: Props) {
  return (
    <span
      className={cn("text-live flex items-center gap-1 font-mono text-xs font-bold", className)}
    >
      <Radio className="size-3 motion-safe:animate-pulse" />
      {LIVE_LABEL.live}
    </span>
  );
}
