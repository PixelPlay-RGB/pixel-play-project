"use client";
// 클립 쇼츠 음량 — 유튜브 쇼츠처럼 영상 우상단에 독립 배치하는 눈에 띄는 스피커 버튼 +
// hover/포커스 시 아래로 펼쳐지는 세로 음량 슬라이더. 음소거 상태에선 "소리를 켜려면
// 누르세요" 힌트가 잠깐 떴다 사라지는 튜토리얼 메시지로 동작한다(치지직 결).

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";

import { CLIP_LABEL } from "@/constants/clip/clip";
import { cn } from "@/lib/utils";

const KEYBOARD_STEP = 0.05;

interface Props {
  muted: boolean;
  // 0~1
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
}

export function ClipVolumeControl({ muted, volume, onToggleMute, onVolumeChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // 세로 트랙: 위=1, 아래=0. 클릭/드래그 지점의 세로 비율로 음량을 정한다.
  function updateFromPointer(clientY: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    onVolumeChange(Math.min(1, Math.max(0, Number(ratio.toFixed(2)))));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientY);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) updateFromPointer(event.clientY);
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const delta = event.key === "ArrowUp" ? KEYBOARD_STEP : -KEYBOARD_STEP;
    onVolumeChange(Math.min(1, Math.max(0, Number((volume + delta).toFixed(2)))));
  }

  const level = muted ? 0 : volume;

  return (
    <div className="group/vol relative flex flex-col items-center">
      {/* 음소거 안내 — 음소거 중 잠깐 떴다 사라지는 튜토리얼 메시지(좌측). */}
      {muted ? (
        <motion.div
          // muted가 true가 될 때마다 새로 마운트돼 애니메이션이 재생된다(unmute 시 사라짐).
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: [0, 1, 1, 0], x: 0 }}
          transition={{ duration: 3.6, times: [0, 0.1, 0.82, 1], ease: "easeOut" }}
          className="bg-brand text-brand-foreground pointer-events-none absolute top-1/2 right-full mr-3 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap shadow-md"
        >
          {CLIP_LABEL.unmuteHint}
        </motion.div>
      ) : null}

      {/* 스피커 버튼 — 음소거 시 brand 링으로 강조 */}
      <button
        type="button"
        aria-label={CLIP_LABEL.volume}
        onClick={onToggleMute}
        className={cn(
          "flex size-12 cursor-pointer items-center justify-center rounded-full text-white opacity-90 backdrop-blur-sm transition-opacity hover:opacity-100",
          muted ? "ring-brand bg-brand/30 ring-2" : "bg-black/45",
        )}
      >
        {muted ? (
          <VolumeX className="size-7" aria-hidden />
        ) : (
          <Volume2 className="size-7" aria-hidden />
        )}
      </button>

      {/* hover/포커스 시 아래로 펼쳐지는 세로 음량 슬라이더 */}
      <div className="pointer-events-none absolute top-full mt-2 flex flex-col items-center rounded-full bg-black/70 px-2.5 py-3 opacity-0 backdrop-blur-sm transition-opacity group-focus-within/vol:pointer-events-auto group-focus-within/vol:opacity-100 group-hover/vol:pointer-events-auto group-hover/vol:opacity-100">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={CLIP_LABEL.volume}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level * 100)}
          className="focus-visible:ring-ring relative h-24 w-1.5 cursor-pointer touch-none rounded-full bg-white/30 outline-none focus-visible:ring-2"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          <div
            className="absolute bottom-0 w-full rounded-full bg-white"
            style={{ height: `${level * 100}%` }}
          />
          <div
            className="absolute left-1/2 size-3 -translate-x-1/2 rounded-full bg-white shadow"
            style={{ bottom: `calc(${level * 100}% - 6px)` }}
          />
        </div>
      </div>
    </div>
  );
}
