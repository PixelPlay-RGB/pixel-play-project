"use client";
// 팔로우 직후 대기 안내 — 채팅 패널과 팝아웃에서 공유합니다.
// 서버가 계산한 남은 대기 시간을 받아 로컬 카운트다운으로 보여주고, 끝나면 상태 갱신을 요청합니다.

import { useEffect, useRef, useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LiveChatUnavailableReason } from "@/types/live/live";

interface Props {
  chatUnavailableReason: LiveChatUnavailableReason | null;
  // 서버 스냅샷 기준 남은 대기 시간(초). 갱신되면 타이머를 다시 맞춘다.
  remainingWaitSeconds?: number;
  // 카운트다운 종료 시 1회 호출 — 채팅 상태를 다시 받아 입력 잠금을 풀게 한다.
  onWaitElapsed?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

function formatWaitTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}초`;
  return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
}

export function LiveChatParticipationNotice({
  chatUnavailableReason,
  remainingWaitSeconds = 0,
  onWaitElapsed,
  actionLabel,
  onAction,
}: Props) {
  // follower_required는 입력바의 팔로우 popover가 안내하므로, 이 카드는 팔로우 직후
  // 대기 상태(follower_wait_required)만 책임진다. 나머지 사유는 렌더하지 않는다.
  // (어떤 사유에 카드를 띄울지 결정은 여기 한 곳에 두고, 호출부는 사유만 넘긴다.)
  const isWaiting = chatUnavailableReason === "follower_wait_required";
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(remainingWaitSeconds, 0));
  const hasElapsedRef = useRef(false);

  // 서버 스냅샷이 갱신되면 타이머를 다시 맞추고, 종료 알림도 다시 쏠 수 있게 초기화한다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsLeft(Math.max(remainingWaitSeconds, 0));
    hasElapsedRef.current = false;
  }, [remainingWaitSeconds]);

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
    if (!isWaiting || secondsLeft > 0 || remainingWaitSeconds <= 0) return;
    if (hasElapsedRef.current) return;
    hasElapsedRef.current = true;
    onWaitElapsed?.();
  }, [isWaiting, secondsLeft, remainingWaitSeconds, onWaitElapsed]);

  if (!isWaiting) {
    return null;
  }

  return (
    <div className="border-border bg-card border-t px-3 py-3">
      <div className="border-live/20 bg-live/5 flex items-center gap-3 rounded-lg border px-3 py-2.5">
        <span className="bg-live/10 text-live flex size-9 shrink-0 items-center justify-center rounded-lg">
          <UserRoundPlus aria-hidden className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-foreground text-xs font-semibold">
            {LIVE_LABEL.participationWaitTitle}
          </p>
          <p className="text-muted-foreground text-xs leading-snug">
            {LIVE_LABEL.participationWaitDesc}
          </p>
        </div>
        {secondsLeft > 0 ? (
          <span
            className="text-live border-live/20 bg-background flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums"
            aria-live="polite"
          >
            {formatWaitTime(secondsLeft)}
          </span>
        ) : null}
        {actionLabel && onAction ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 text-xs"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
