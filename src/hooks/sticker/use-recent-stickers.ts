"use client";
// 최근 사용한 스티커(이모지) id를 localStorage에 기록·조회한다(피커 "최근 사용" 탭).
// id만 저장하고, 실제 Sticker 해석(기본 레지스트리 + 채널 스티커)은 호출부가 한다 —
// 다른 채널 이모지 id는 현재 맥락에서 못 찾으면 자연 제외된다.

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pp-recent-stickers";
const MAX_RECENT = 20;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function useRecentStickers() {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // localStorage는 클라 전용 — 마운트 후 1회 읽어 hydration 불일치를 피한다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentIds(readRecent());
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((value) => value !== id)].slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 저장 실패(용량·프라이빗 모드)는 무시 — 이번 세션 메모리 상태로만 유지된다.
      }
      return next;
    });
  }, []);

  return { recentIds, addRecent };
}
