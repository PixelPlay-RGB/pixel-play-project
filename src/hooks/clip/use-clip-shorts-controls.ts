"use client";
// 쇼츠 뷰어 입력 컨트롤 — 키보드 단축키(↑/↓·스페이스·k·m·f)와 마우스 휠 탐색을 한곳에 묶는다.
// 동작·등록/정리 타이밍은 쇼츠 뷰에서 그대로 옮긴 것이며, 콜백은 모두 인자로 받는다.

import { useCallback, useEffect, useRef, type WheelEvent } from "react";

interface ClipShortsControlsParams {
  goPrev: () => void;
  goNext: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
}

export function useClipShortsControls({
  goPrev,
  goNext,
  togglePlay,
  toggleMute,
  toggleFullscreen,
}: ClipShortsControlsParams) {
  // 단축키 — ↑/↓: 이전/다음, 스페이스·k: 재생/일시정지, m: 음소거, f: 전체화면.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      // 음량 슬라이더(role=slider) 등 자체 키 처리를 하는 컨트롤에 포커스가 있으면 단축키를 막는다
      // (안 막으면 음량 ↑/↓가 클립 탐색까지 동시에 발동한다).
      if (target?.closest("input, textarea, select, [contenteditable=true], [role='slider']"))
        return;

      switch (event.key.toLowerCase()) {
        case "arrowup":
          event.preventDefault();
          goPrev();
          break;
        case "arrowdown":
          event.preventDefault();
          goNext();
          break;
        case " ":
        case "k":
          // 버튼에 포커스가 있을 때 스페이스는 그 버튼 클릭이 우선.
          if (event.key === " " && target?.closest("button, [role='button']")) return;
          event.preventDefault();
          togglePlay();
          break;
        case "m":
          event.preventDefault();
          toggleMute();
          break;
        case "f":
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext, togglePlay, toggleMute, toggleFullscreen]);

  // 마우스 휠로도 탐색한다 — 한 번의 스크롤이 한 칸만 넘어가게 스로틀한다.
  const lastWheelRef = useRef(0);
  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) < 16) return;
      if (event.timeStamp - lastWheelRef.current < 450) return;
      lastWheelRef.current = event.timeStamp;
      if (event.deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    [goNext, goPrev],
  );

  return { handleWheel };
}
