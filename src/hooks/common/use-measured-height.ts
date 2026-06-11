"use client";
// ref가 가리키는 요소의 렌더 높이(px)를 추적합니다 — 첫 페인트 전 1회 측정 + ResizeObserver로 갱신.
// (채팅 후원 랭킹 배너처럼 접고 펼치는 오버레이의 실제 높이를 레이아웃 계산에 쓰는 용도)

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export function useMeasuredHeight<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 첫 페인트 전에 즉시 측정해 초기 프레임부터 정확한 높이를 쓴다.
    setHeight(element.offsetHeight);

    const observer = new ResizeObserver(() => {
      setHeight(element.offsetHeight);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, height];
}
