"use client";
// 라이브 플레이어 음량 컨트롤 — 음소거 토글과 hover 시 펼쳐지는 음량 슬라이더입니다.

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIVE_LABEL, LIVE_PLAYER_ICON_BUTTON_CLASS } from "@/constants/live/live";
import { cn } from "@/lib/utils";

interface Props {
  muted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
}

// lucide volume-2/volume-x 원본 path를 쓰되 스피커 본체는 채워서(유튜브식) 재생 버튼과
// 무게감을 맞추고, 바깥(두 번째) 물결은 음량 50% 초과에서만 또렷하게 — 이하에서는 지우는
// 대신 투명하게 남겨 현재 음량 크기를 표현한다. 음소거는 물결 대신 X를 그린다.
function VolumeStateIcon({
  muted,
  isSecondWaveActive,
}: {
  muted: boolean;
  isSecondWaveActive: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden
    >
      <path
        d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
        className="fill-current"
      />
      {muted ? (
        <>
          <line x1="22" x2="16" y1="9" y2="15" />
          <line x1="16" x2="22" y1="9" y2="15" />
        </>
      ) : (
        <>
          <path d="M16 9a5 5 0 0 1 0 6" />
          <path
            d="M19.364 18.364a9 9 0 0 0 0-12.728"
            className={cn("transition-opacity", isSecondWaveActive ? "opacity-100" : "opacity-40")}
          />
        </>
      )}
    </svg>
  );
}

export function LivePlayerVolumeControl({ muted, volume, onToggleMute, onVolumeChange }: Props) {
  return (
    <div className="group/volume flex items-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={muted ? LIVE_LABEL.playerUnmute : LIVE_LABEL.playerMute}
              className={LIVE_PLAYER_ICON_BUTTON_CLASS}
              onClick={onToggleMute}
            />
          }
        >
          <VolumeStateIcon muted={muted} isSecondWaveActive={volume > 0.5} />
        </TooltipTrigger>
        <TooltipContent>
          {muted ? LIVE_LABEL.playerUnmute : LIVE_LABEL.playerMute} (m)
        </TooltipContent>
      </Tooltip>
      <div className="w-0 overflow-hidden transition-all duration-200 group-focus-within/volume:w-20 group-hover/volume:w-20">
        <Slider
          aria-label={LIVE_LABEL.playerVolume}
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onValueChange={onVolumeChange}
          className="w-20 px-1"
        />
      </div>
    </div>
  );
}
