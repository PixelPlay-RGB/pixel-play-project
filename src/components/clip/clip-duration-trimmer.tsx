"use client";
// 클립 구간 트리머 — 지난 ~{bufferSeconds}초를 담은 필름스트립(프레임 셀 + 스프로킷 홀) 위에서,
// 양 끝 핸들을 드래그하거나 가운데 밴드를 끌어 원하는 15~30초 구간을 자유롭게 잡는다.
// 오른쪽 끝(지금=라이브 시점)으로부터 윈도우 끝까지의 거리 = end_offset, 밴드 폭 = duration.
// ※ 버퍼 슬라이드 때문에 추출 안전 한계가 bufferSeconds라, 구간은 [0, bufferSeconds] 안에서만 움직인다.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";

import { CLIP_LABEL } from "@/constants/clip/clip";

const SPROCKET_COUNT = 20;

type DragMode = "start" | "end" | "move";

interface Props {
  // 윈도우 길이(초, min~max)와 위치(클립 시점=지금으로부터 윈도우 끝까지의 거리, 초).
  durationSeconds: number;
  endOffsetSeconds: number;
  min: number;
  max: number;
  // 필름스트립이 보여주는 되돌리기 범위(초). 구간은 [0, bufferSeconds] 안에서만 움직인다.
  bufferSeconds: number;
  // 필름스트립 셀 이미지(작은 jpeg data URL). 비어 있으면 무지 트랙으로 폴백.
  frames: string[];
  onChange: (next: { durationSeconds: number; endOffsetSeconds: number }) => void;
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

function SprocketRow() {
  // flex-1 천공이라 폭에 따라 균등 분배·축소 — 좁은 화면에서도 넘치지 않는다. 드래그를 막지 않게
  // pointer-events-none(아래 트랙이 포인터를 받는다).
  return (
    <div className="pointer-events-none flex h-3 items-center gap-1.5 bg-black px-1.5" aria-hidden>
      {Array.from({ length: SPROCKET_COUNT }, (_, index) => (
        <span key={index} className="h-1.5 flex-1 rounded-[1px] bg-white/45" />
      ))}
    </div>
  );
}

export function ClipDurationTrimmer({
  durationSeconds,
  endOffsetSeconds,
  min,
  max,
  bufferSeconds,
  frames,
  onChange,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: DragMode; grabOffset: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 현재 구간(초 좌표, 0 = 가장 과거 bufferSeconds초 전, bufferSeconds = 지금).
  const windowEnd = bufferSeconds - endOffsetSeconds;
  const windowStart = windowEnd - durationSeconds;

  // 정수로 커밋하되 length+offset이 버퍼를 넘지 않도록 offset을 한 번 더 클램프한다(독립 반올림 보정).
  const commit = useCallback(
    (rawDuration: number, rawEndOffset: number) => {
      const duration = clamp(Math.round(rawDuration), min, max);
      const endOffset = clamp(Math.round(rawEndOffset), 0, bufferSeconds - duration);
      onChange({ durationSeconds: duration, endOffsetSeconds: endOffset });
    },
    [bufferSeconds, max, min, onChange],
  );

  // clientX → 트랙 내 초 좌표(0..bufferSeconds).
  const pointerToSeconds = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return null;
      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return clamp(ratio * bufferSeconds, 0, bufferSeconds);
    },
    [bufferSeconds],
  );

  const applyDrag = useCallback(
    (clientX: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      const pos = pointerToSeconds(clientX);
      if (pos === null) return;

      const end = bufferSeconds - endOffsetSeconds;
      const start = end - durationSeconds;

      if (drag.mode === "start") {
        // 왼쪽 핸들: 시작점 이동(끝 고정) → 길이 변경.
        const newStart = clamp(pos, Math.max(0, end - max), end - min);
        commit(end - newStart, endOffsetSeconds);
      } else if (drag.mode === "end") {
        // 오른쪽 핸들: 끝점 이동(시작 고정) → 길이·위치 변경.
        const newEnd = clamp(pos, start + min, Math.min(bufferSeconds, start + max));
        commit(newEnd - start, bufferSeconds - newEnd);
      } else {
        // 가운데 밴드: 길이 고정한 채 통째로 이동.
        const newStart = clamp(pos - drag.grabOffset, 0, bufferSeconds - durationSeconds);
        commit(durationSeconds, bufferSeconds - (newStart + durationSeconds));
      }
    },
    [bufferSeconds, commit, durationSeconds, endOffsetSeconds, max, min, pointerToSeconds],
  );

  // 드래그는 window 리스너로 추적한다 — 포인터가 트랙 밖으로 나가도 끊기지 않는다.
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (event: globalThis.PointerEvent) => applyDrag(event.clientX);
    const handleUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [isDragging, applyDrag]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const mode =
      (target.closest("[data-handle]")?.getAttribute("data-handle") as DragMode) ?? "move";

    let grabOffset = 0;
    if (mode === "move") {
      const pos = pointerToSeconds(event.clientX);
      grabOffset = pos === null ? durationSeconds / 2 : pos - windowStart;
      // 밴드 밖(빈 트랙)을 잡으면 가운데를 잡은 것으로 보정해 부드럽게 이동시킨다.
      if (grabOffset < 0 || grabOffset > durationSeconds) grabOffset = durationSeconds / 2;
    }

    dragRef.current = { mode, grabOffset };
    setIsDragging(true);
    applyDrag(event.clientX);
  }

  // 키보드: 왼쪽 핸들=길이(↑/← 길게), 오른쪽 핸들=위치(←더 과거 / →더 최신).
  function handleStartKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    let next: number;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        next = durationSeconds + 1;
        break;
      case "ArrowRight":
      case "ArrowDown":
        next = durationSeconds - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    commit(next, endOffsetSeconds);
  }

  function handleEndKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    let next: number;
    switch (event.key) {
      case "ArrowLeft":
        next = endOffsetSeconds + 1;
        break;
      case "ArrowRight":
        next = endOffsetSeconds - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    commit(durationSeconds, next);
  }

  const leftPercent = (windowStart / bufferSeconds) * 100;
  const widthPercent = (durationSeconds / bufferSeconds) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-medium">{CLIP_LABEL.durationLabel}</span>
        <span className="text-brand text-sm font-bold tabular-nums">
          {durationSeconds}
          {CLIP_LABEL.durationUnit}
        </span>
      </div>

      <div
        ref={trackRef}
        className="bg-muted relative w-full touch-none overflow-hidden rounded-xl select-none"
        onPointerDown={handlePointerDown}
      >
        <SprocketRow />
        {/* 프레임 셀 — 지난 ~{bufferSeconds}초의 실제 장면. native 이미지 드래그가 포인터를
            가로채지 않게 pointer-events-none + draggable=false. */}
        <div className="bg-background pointer-events-none flex h-16 select-none">
          {frames.length > 0 ? (
            frames.map((frame, index) => (
              <div
                key={index}
                className="relative h-full min-w-0 flex-1 border-r border-black/50 last:border-r-0"
              >
                <Image
                  src={frame}
                  alt=""
                  fill
                  unoptimized
                  draggable={false}
                  className="object-cover"
                />
              </div>
            ))
          ) : (
            <div className="bg-muted h-full w-full" />
          )}
        </div>
        <SprocketRow />

        {/* 선택 구간 밖 딤(앞/뒤) */}
        <div
          className="bg-background/70 pointer-events-none absolute inset-y-0 left-0"
          style={{ width: `${leftPercent}%` }}
        />
        <div
          className="bg-background/70 pointer-events-none absolute inset-y-0 right-0"
          style={{ width: `${Math.max(0, 100 - leftPercent - widthPercent)}%` }}
        />

        {/* 선택 구간 밴드 — 가운데를 끌면 길이 고정한 채 통째로 이동 */}
        <div
          data-handle="move"
          className="border-brand ring-brand/30 absolute inset-y-0 cursor-grab border-2 ring-1 active:cursor-grabbing"
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
        >
          {/* 왼쪽(시작/길이) 핸들 */}
          <span
            data-handle="start"
            role="slider"
            tabIndex={0}
            aria-label={CLIP_LABEL.durationLabel}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={durationSeconds}
            onKeyDown={handleStartKeyDown}
            className="bg-brand absolute inset-y-0 left-0 flex w-3 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-sm shadow outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="bg-brand-foreground h-5 w-0.5 rounded-full" />
          </span>
          {/* 오른쪽(끝/위치) 핸들 */}
          <span
            data-handle="end"
            role="slider"
            tabIndex={0}
            aria-label={CLIP_LABEL.clipMoment}
            aria-valuemin={0}
            aria-valuemax={Math.max(0, bufferSeconds - durationSeconds)}
            aria-valuenow={endOffsetSeconds}
            onKeyDown={handleEndKeyDown}
            className="bg-brand absolute inset-y-0 right-0 flex w-3 translate-x-1/2 cursor-ew-resize items-center justify-center rounded-sm shadow outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="bg-brand-foreground h-5 w-0.5 rounded-full" />
          </span>
        </div>
      </div>

      <div className="text-muted-foreground flex justify-between text-[11px]">
        <span>
          {bufferSeconds}
          {CLIP_LABEL.durationUnit} 전
        </span>
        <span>{CLIP_LABEL.now}</span>
      </div>
    </div>
  );
}
