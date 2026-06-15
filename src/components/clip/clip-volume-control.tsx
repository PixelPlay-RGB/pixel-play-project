"use client";
// 클립 쇼츠 음량 — 치지직처럼 레일 최상단에 스피커 버튼 + "항상 보이는" 세로 음량 슬라이더를 둔다.
// 음량 레벨이 인디케이터로 늘 보이고(hover 게이트 없음), 드래그/방향키로 조절한다. 음소거 상태에선
// brand로 강조 + "소리를 켜려면 누르세요" 힌트가 잠깐 떴다 사라진다(튜토리얼).

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { motion } from "motion/react";
import { Volume1, Volume2, VolumeX } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
    // 부모(쇼츠 뷰) window 핸들러로 전파되어 클립 탐색까지 발동하는 것을 막는다.
    event.stopPropagation();
    const delta = event.key === "ArrowUp" ? KEYBOARD_STEP : -KEYBOARD_STEP;
    onVolumeChange(Math.min(1, Math.max(0, Number((volume + delta).toFixed(2)))));
  }

  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;
  const toggleLabel = muted ? CLIP_LABEL.unmute : CLIP_LABEL.mute;

  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* 음소거 안내 — 음소거 중 잠깐 떴다 사라지는 튜토리얼 메시지. 클립(영상)은 왼쪽에 있으므로
          힌트는 버튼 오른쪽(바깥쪽)으로 띄워 영상을 가리지 않게 한다. */}
      {muted ? (
        <motion.div
          // muted가 true가 될 때마다 새로 마운트돼 애니메이션이 재생된다(unmute 시 사라짐).
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: [0, 1, 1, 0], x: 0 }}
          transition={{ duration: 3.6, times: [0, 0.1, 0.82, 1], ease: "easeOut" }}
          className="bg-brand text-brand-foreground pointer-events-none absolute top-3 left-full ml-3 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap shadow-md"
        >
          {CLIP_LABEL.unmuteHint}
        </motion.div>
      ) : null}

      {/* 스피커 버튼 — 음소거 시 brand 글로우로 강조 */}
      <Tooltip>
        <TooltipTrigger
          render={
            <motion.button
              type="button"
              aria-label={toggleLabel}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleMute}
              className={cn(
                "flex size-12 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-opacity",
                muted
                  ? "bg-brand text-brand-foreground shadow-brand/40 shadow-lg"
                  : "bg-black/45 text-white opacity-90 hover:opacity-100",
              )}
            >
              <Icon className="size-7" aria-hidden />
            </motion.button>
          }
        />
        <TooltipContent side="left">{toggleLabel}</TooltipContent>
      </Tooltip>

      {/* 항상 보이는 세로 음량 슬라이더(치지직 결) — 레벨 인디케이터가 늘 보인다 */}
      <div className="flex flex-col items-center rounded-full bg-black/45 px-2 py-2.5 backdrop-blur-sm">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={CLIP_LABEL.volume}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level * 100)}
          className="focus-visible:ring-ring relative h-16 w-1.5 cursor-pointer touch-none rounded-full bg-white/25 outline-none focus-visible:ring-2"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            className="bg-brand absolute bottom-0 w-full rounded-full"
            animate={{ height: `${level * 100}%` }}
            transition={{ type: "tween", duration: 0.12 }}
          />
          <motion.div
            className="absolute left-1/2 size-3 -translate-x-1/2 rounded-full bg-white shadow"
            animate={{ bottom: `calc(${level * 100}% - 6px)` }}
            transition={{ type: "tween", duration: 0.12 }}
          />
        </div>
      </div>
    </div>
  );
}
