"use client";
// 16:9 스냅샷 위에서 9:16 크롭 박스를 좌우로 드래그해 잘라낼 위치를 고릅니다.
// cropXFraction(0~1)은 "잔여 폭 대비 박스 왼쪽 위치" — 서버 ffmpeg crop 식과 동일 의미.

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

import { CLIP_LABEL } from "@/constants/clip/clip";
import { cn } from "@/lib/utils";

// 16:9 컨테이너 안 9:16 박스의 폭 비율 = (9/16) / (16/9) ≈ 31.64%.
const CROP_BOX_WIDTH_PERCENT = (81 / 256) * 100;
const KEYBOARD_STEP = 0.05;

interface Props {
  // 캡처 실패 시 null — 박스 드래그는 그대로 동작한다(서버 추출엔 영향 없음).
  snapshotDataUrl: string | null;
  cropXFraction: number;
  onCropXFractionChange: (fraction: number) => void;
}

export function ClipCropSelector({ snapshotDataUrl, cropXFraction, onCropXFractionChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  function updateFromPointer(clientX: number) {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const boxWidth = rect.width * (CROP_BOX_WIDTH_PERCENT / 100);
    const usableWidth = rect.width - boxWidth;
    if (usableWidth <= 0) return;

    const next = (clientX - rect.left - boxWidth / 2) / usableWidth;
    onCropXFractionChange(Math.min(1, Math.max(0, next)));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    updateFromPointer(event.clientX);
  }

  function handlePointerUp() {
    isDraggingRef.current = false;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -KEYBOARD_STEP : KEYBOARD_STEP;
    onCropXFractionChange(Math.min(1, Math.max(0, cropXFraction + delta)));
  }

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label={CLIP_LABEL.cropGuide}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(cropXFraction * 100)}
      className="bg-muted focus-visible:ring-ring/50 relative aspect-video w-full cursor-ew-resize touch-none overflow-hidden rounded-lg outline-none select-none focus-visible:ring-2"
      style={
        snapshotDataUrl
          ? {
              backgroundImage: `url(${snapshotDataUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {/* 박스 바깥 영역 디밍 — 잘려나갈 부분을 직관적으로 보여준다 */}
      <div
        className="absolute inset-y-0 left-0 bg-black/55"
        style={{ width: `calc(${cropXFraction} * (100% - ${CROP_BOX_WIDTH_PERCENT}%))` }}
      />
      <div
        className="absolute inset-y-0 right-0 bg-black/55"
        style={{ width: `calc(${1 - cropXFraction} * (100% - ${CROP_BOX_WIDTH_PERCENT}%))` }}
      />
      {/* 9:16 크롭 박스 */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 rounded-sm border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]",
        )}
        style={{
          width: `${CROP_BOX_WIDTH_PERCENT}%`,
          left: `calc(${cropXFraction} * (100% - ${CROP_BOX_WIDTH_PERCENT}%))`,
        }}
      />
    </div>
  );
}
