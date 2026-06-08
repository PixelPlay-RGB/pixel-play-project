"use client";
// 방송 시작 시각으로부터 경과 시간을 1초 간격으로 HH:MM:SS 문자열로 제공합니다.

import { useEffect, useState } from "react";

// 렌더 중 Date.now()·effect 내 동기 setState를 피하려고 첫 틱 전에는 null을 반환한다.
export function useAnalyticsElapsed(startedAt: string): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const startMs = new Date(startedAt).getTime();

    if (Number.isNaN(startMs)) {
      return;
    }

    const id = setInterval(() => {
      setLabel(formatElapsed(Date.now() - startMs));
    }, 1_000);

    return () => clearInterval(id);
  }, [startedAt]);

  return label;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
}
