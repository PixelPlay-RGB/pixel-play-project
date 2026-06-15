"use client";
// 클립 길이 트리머 — 타임라인 트랙(0~max초) 위에서 오른쪽(클립 시점)에 고정된 선택 구간의
// 왼쪽 핸들을 드래그해 길이(min~max초)를 정한다. 단순 슬라이더 대신 트림 바 형태(치지직 결).
// ※ 버퍼 구조상 구간은 항상 "클립 시점까지의 마지막 N초" — 위치 이동은 없고 길이만 조절한다.

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

import { CLIP_LABEL } from "@/constants/clip/clip";

const TICK_COUNT = 24;

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (seconds: number) => void;
}

export function ClipDurationTrimmer({ value, min, max, onChange }: Props) {
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
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    // 왼쪽=길게, 오른쪽=짧게.
    const delta = event.key === "ArrowLeft" ? 1 : -1;
    onChange(Math.min(max, Math.max(min, value + delta)));
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
        className="bg-muted focus-visible:ring-ring/50 relative h-14 w-full cursor-ew-resize touch-none overflow-hidden rounded-xl outline-none select-none focus-visible:ring-2"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        {/* 눈금 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
          {Array.from({ length: TICK_COUNT }, (_, index) => (
            <span key={index} className="bg-foreground/15 h-3 w-px" />
          ))}
        </div>
        {/* 잘려나가는 앞부분(딤) */}
        <div
          className="bg-background/55 pointer-events-none absolute inset-y-0 left-0"
          style={{ width: `${windowLeftPercent}%` }}
        />
        {/* 선택 구간 — 오른쪽(클립 시점)에 고정 */}
        <div
          className="border-brand bg-brand/15 pointer-events-none absolute inset-y-0 right-0 border-2"
          style={{ left: `${windowLeftPercent}%` }}
        >
          {/* 왼쪽 드래그 핸들 */}
          <span className="bg-brand absolute inset-y-0 left-0 flex w-2 -translate-x-1/2 items-center justify-center rounded-full">
            <span className="bg-brand-foreground h-4 w-0.5 rounded-full" />
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
