"use client";
// 클립 쇼츠 우측 레일 음량 컨트롤 — 버튼은 음소거 토글, hover/포커스 시 좌측으로 음량
// 슬라이더가 은은하게(opacity) 펼쳐진다. 모바일(터치)에선 토글만으로 충분하다.

import { Volume2, VolumeX } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { CLIP_LABEL } from "@/constants/clip/clip";

interface Props {
  muted: boolean;
  // 0~1
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
}

export function ClipVolumeControl({ muted, volume, onToggleMute, onVolumeChange }: Props) {
  return (
    <div className="group/vol relative flex items-center">
      {/* hover 시 좌측으로 펼쳐지는 음량 슬라이더 */}
      <div className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 opacity-0 transition-opacity group-focus-within/vol:pointer-events-auto group-focus-within/vol:opacity-100 group-hover/vol:pointer-events-auto group-hover/vol:opacity-100">
        <div className="w-28 rounded-full bg-black/70 px-3 py-2.5 backdrop-blur-sm">
          <Slider
            value={muted ? 0 : volume}
            max={1}
            step={0.05}
            onValueChange={onVolumeChange}
            aria-label={CLIP_LABEL.volume}
            className="cursor-pointer"
          />
        </div>
      </div>
      <button
        type="button"
        aria-label={CLIP_LABEL.volume}
        onClick={onToggleMute}
        className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-90 backdrop-blur-sm transition-opacity hover:opacity-100"
      >
        {muted ? (
          <VolumeX className="size-6" aria-hidden />
        ) : (
          <Volume2 className="size-6" aria-hidden />
        )}
      </button>
    </div>
  );
}
