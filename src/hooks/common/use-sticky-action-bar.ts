"use client";
// 헤더 액션이 스크롤로 화면 밖에 나가면 플로팅 액션 바를 띄우기 위한 훅입니다.

import { useEffect, useRef, useState } from "react";

interface Result {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  show: boolean;
}

/**
 * active(보통 isDirty)가 true이고, sentinel이 스크롤로 화면에서 사라지면 show를 true로 반환합니다.
 * 내부 overflow 컨테이너에서도 IntersectionObserver가 클리핑을 반영하므로 root=null로 동작합니다.
 */
export function useStickyActionBar(active: boolean): Result {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSentinelVisible, setIsSentinelVisible] = useState(true);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSentinelVisible(entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, show: active && !isSentinelVisible };
}
