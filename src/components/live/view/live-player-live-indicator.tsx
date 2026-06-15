// 점멸 LIVE 인디케이터 — 플레이어 컨트롤 바와 미니플레이어가 공유합니다(점멸 정책·색을 한 곳에서 관리).
// onSeekToLive가 있으면 컨트롤 바용 실시간 복귀 버튼(코랄=실시간/회색=지연, 클릭 시 라이브 엣지 복귀),
// 없으면 미니플레이어용 정적 배지로 렌더한다.

import { Radio } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";

interface Props {
  // 정적 모드에선 span, 클릭(복귀 버튼) 모드에선 button에 부착된다(모드는 onSeekToLive 유무로 결정).
  className?: string;
  // 실시간 지점 여부와 복귀 액션 — 둘 다 있으면 클릭 가능한 복귀 버튼(컨트롤 바)으로 렌더한다.
  isAtLiveEdge?: boolean;
  onSeekToLive?: () => void;
}

export function LivePlayerLiveIndicator({ className, isAtLiveEdge, onSeekToLive }: Props) {
  // 미니플레이어 등: 항상 점멸하는 정적 배지(복귀 액션 없음).
  if (!onSeekToLive) {
    return (
      <span
        className={cn("text-live flex items-center gap-1 font-mono text-xs font-bold", className)}
      >
        <Radio className="size-3 motion-safe:animate-pulse" />
        {LIVE_LABEL.live}
      </span>
    );
  }

  // 컨트롤 바: 실시간이면 코랄 점+점멸, 일시정지·지연이면 회색. 클릭 시 라이브 엣지로 복귀(치지직식).
  const label = isAtLiveEdge ? LIVE_LABEL.playerAtLiveEdge : LIVE_LABEL.playerGoToLiveEdge;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 transition-colors",
              isAtLiveEdge ? "text-live" : "text-white/50 hover:text-white/80",
              className,
            )}
            onClick={onSeekToLive}
          />
        }
      >
        <span
          className={cn(
            "size-2 rounded-full bg-current",
            isAtLiveEdge && "motion-safe:animate-pulse",
          )}
        />
        {LIVE_LABEL.live}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
