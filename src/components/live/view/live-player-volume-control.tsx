"use client";
// 라이브 플레이어 음량 컨트롤 — 음소거 토글과 hover 시 펼쳐지는 음량 슬라이더입니다.

import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LIVE_LABEL, LIVE_PLAYER_ICON_BUTTON_CLASS } from "@/constants/live/live";

interface Props {
  muted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
}

export function LivePlayerVolumeControl({ muted, volume, onToggleMute, onVolumeChange }: Props) {
  return (
    <div className="group/volume flex items-center">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={muted ? LIVE_LABEL.playerUnmute : LIVE_LABEL.playerMute}
        className={LIVE_PLAYER_ICON_BUTTON_CLASS}
        onClick={onToggleMute}
      >
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </Button>
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
