"use client";
// 클립 길이 트리머 — 지난 ~30초를 담은 필름스트립(프레임 셀 + 스프로킷 홀) 위에서, 오른쪽
// (클립 시점)에 고정된 선택 구간의 왼쪽 핸들을 드래그해 길이(min~max초)를 정한다(치지직 결).
// ※ 버퍼 구조상 구간은 "클립 시점까지의 마지막 N초" — 시작점만 당기고 끝(클립 시점)은 고정.

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";

import { CLIP_LABEL } from "@/constants/clip/clip";

const SPROCKET_COUNT = 20;

interface Props {
  value: number;
  min: number;
  max: number;
  // 필름스트립 셀 이미지(작은 jpeg data URL). 비어 있으면 무지 트랙으로 폴백.
  frames: string[];
  onChange: (seconds: number) => void;
}

function SprocketRow() {
  // flex-1 천공이라 폭에 따라 균등 분배·축소 — 좁은 모바일에서도 넘치지 않는다.
  return (
    <div className="flex h-3 items-center gap-1.5 bg-black px-1.5" aria-hidden>
      {Array.from({ length: SPROCKET_COUNT }, (_, index) => (
        <span key={index} className="h-1.5 flex-1 rounded-[1px] bg-white/45" />
      ))}
    </div>
  );
}

export function ClipDurationTrimmer({ value, min, max, frames, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // 트랙: 왼쪽=가장 과거(max초 전), 오른쪽=클립 시점. 클릭/드래그 지점이 선택 구간의
  // 왼쪽 경계 → 길이 = (1 - leftRatio) * max.
  function updateFromPointer(clientX: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const leftRatio = (clientX - rect.left) / rect.width;
    const seconds = (1 - leftRatio) * max;
    onChange(Math.min(max, Math.max(min, Math.round(seconds))));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) updateFromPointer(event.clientX);
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // 왼쪽/위=길게, 오른쪽/아래=짧게, Home=최소, End=최대(WAI-ARIA slider).
    let next: number;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        next = value + 1;
        break;
      case "ArrowRight":
      case "ArrowDown":
        next = value - 1;
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    onChange(Math.min(max, Math.max(min, next)));
  }

  // 선택 구간의 왼쪽 위치(%) = 잘려나간 앞부분 비율.
  const windowLeftPercent = ((max - value) / max) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-medium">{CLIP_LABEL.durationLabel}</span>
        <span className="text-brand text-sm font-bold tabular-nums">
          {value}
          {CLIP_LABEL.durationUnit}
        </span>
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={CLIP_LABEL.durationLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="bg-muted focus-visible:ring-ring/50 relative w-full cursor-ew-resize touch-none overflow-hidden rounded-xl outline-none select-none focus-visible:ring-2"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <SprocketRow />
        {/* 프레임 셀 — 지난 ~30초의 실제 장면 */}
        <div className="bg-background flex h-16">
          {frames.length > 0 ? (
            frames.map((frame, index) => (
              <div
                key={index}
                className="relative h-full min-w-0 flex-1 border-r border-black/50 last:border-r-0"
              >
                <Image src={frame} alt="" fill unoptimized className="object-cover" />
              </div>
            ))
          ) : (
            <div className="bg-muted h-full w-full" />
          )}
        </div>
        <SprocketRow />

        {/* 잘려나가는 앞부분 딤 */}
        <div
          className="bg-background/70 pointer-events-none absolute inset-y-0 left-0"
          style={{ width: `${windowLeftPercent}%` }}
        />
        {/* 선택 구간 — 오른쪽(클립 시점)에 고정 */}
        <div
          className="border-brand pointer-events-none absolute inset-y-0 right-0 border-2 ring-1 ring-black/20"
          style={{ left: `${windowLeftPercent}%` }}
        >
          {/* 왼쪽 드래그 핸들 */}
          <span className="bg-brand absolute inset-y-0 left-0 flex w-2.5 -translate-x-1/2 items-center justify-center rounded-sm shadow">
            <span className="bg-brand-foreground h-5 w-0.5 rounded-full" />
          </span>
        </div>
      </div>

      <div className="text-muted-foreground flex justify-between text-[11px]">
        <span>
          {max}
          {CLIP_LABEL.durationUnit} 전
        </span>
        <span>{CLIP_LABEL.clipMoment}</span>
      </div>
    </div>
  );
}
