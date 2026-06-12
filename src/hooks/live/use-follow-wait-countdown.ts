"use client";
// 팔로우 대기 남은 시간 카운트다운 — 서버 스냅샷(초)을 받아 1초씩 줄이고,
// 0에 닿으면 채팅 상태 갱신을 1회 요청해 입력 잠금이 풀리게 합니다.

import { useEffect, useRef, useState } from "react";

export function useFollowWaitCountdown(
  isWaiting: boolean,
  remainingSeconds: number,
  onElapsed?: () => void,
): number {
  const remaining = Math.max(remainingSeconds, 0);
  const [syncedRemaining, setSyncedRemaining] = useState(remaining);
  const [secondsLeft, setSecondsLeft] = useState(remaining);
  // 종료 알림을 보낸 스냅샷 값 — 같은 스냅샷에 중복 알림하지 않고, 새 스냅샷이 오면 자연 리셋된다.
  const elapsedNotifiedForRef = useRef<number | null>(null);

  // 서버 스냅샷이 갱신되면 타이머를 다시 맞춘다(렌더 중 가드된 setState — 조정 패턴).
  if (syncedRemaining !== remaining) {
    setSyncedRemaining(remaining);
    setSecondsLeft(remaining);
  }

  // 1초 단위 카운트다운 — secondsLeft가 deps라 매 초 타이머가 새로 걸리는 체인 방식.
  useEffect(() => {
    if (!isWaiting || secondsLeft <= 0) return;

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isWaiting, secondsLeft]);

  // 카운트다운이 끝나면 채팅 상태 refetch를 1회 요청한다(서버가 잠금 해제를 확정).
  useEffect(() => {
    if (!isWaiting || secondsLeft > 0 || remaining <= 0) return;
    if (elapsedNotifiedForRef.current === remaining) return;
    elapsedNotifiedForRef.current = remaining;
    onElapsed?.();
  }, [isWaiting, secondsLeft, remaining, onElapsed]);

  return secondsLeft;
}

// "m분 s초" 형태의 대기 시간 표기(분이 없으면 초만).
export function formatFollowWaitTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}초`;
  return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
}
