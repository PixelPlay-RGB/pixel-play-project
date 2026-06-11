"use client";
// 방송 시작 후 경과 시간을 1초마다 갱신해 "MM:SS"/"H:MM:SS" 문자열로 반환합니다.

import { useEffect, useState } from "react";

import { formatElapsedTime } from "@/utils/live/live-chat";

// isRunning=false면(방송 종료) 인터벌을 돌리지 않고 주어진 초를 멈춘 값으로 그대로 표시한다.
export function useLiveElapsed(initialSeconds: number, isRunning = true): string {
  const [tickSeconds, setTickSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning) return;
    // 기준점은 effect 안에서 캡처해 렌더 순수성을 지킨다. initialSeconds가 refetch로 바뀌면
    // 의존성으로 effect가 재실행되며 기준점을 다시 잡으므로 누적 중복 없이 보정된다.
    const initial = initialSeconds;
    const startedAt = Date.now();

    const intervalId = setInterval(() => {
      setTickSeconds(initial + Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [initialSeconds, isRunning]);

  return formatElapsedTime(isRunning ? tickSeconds : initialSeconds);
}
