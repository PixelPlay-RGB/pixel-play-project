"use client";
// 방송 운영 추첨 도구 화면 — 모집 제어, 옵션 토글, 후보 목록과 릴 연출을 렌더링합니다.

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DRAW_REEL_DURATION_MS,
  DRAW_REEL_ROW_HEIGHT_PX,
  DRAW_TIMER_MAX_SECONDS,
} from "@/constants/channel/live-interaction";
import type { ChannelLiveDrawTool } from "@/hooks/channel/use-channel-live-draw-tool";
import { cn } from "@/lib/utils";

interface Props {
  broadcastId: string | null;
  tool: ChannelLiveDrawTool;
}

export function ChannelLiveDrawToolView({ broadcastId, tool }: Props) {
  const {
    canPickDrawWinner,
    drawParticipants,
    drawReelNames,
    drawReelTargetIndex,
    drawRollingName,
    drawSession,
    drawTimerSeconds,
    drawWinnerNames,
    handleDrawTimerSecondsChange,
    handlePickDrawWinner,
    handleToggleDrawRecruitment,
    isDrawExcludePreviousWinners,
    isDrawFollowerOnly,
    isDrawing,
    isDrawParticipantLoading,
    isDrawRecruiting,
    isDrawRecruitmentPending,
    isDrawTimerEnabled,
    setIsDrawExcludePreviousWinners,
    setIsDrawFollowerOnly,
    setIsDrawTimerEnabled,
  } = tool;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="outline"
          className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-16 rounded-lg px-8 text-base font-black"
          disabled={
            !broadcastId || isDrawParticipantLoading || isDrawing || isDrawRecruitmentPending
          }
          onClick={() => void handleToggleDrawRecruitment()}
        >
          {isDrawRecruitmentPending ? "처리 중" : isDrawRecruiting ? "종료" : "모집하기"}
        </Button>
        <Button
          type="button"
          className="bg-brand hover:bg-brand/90 h-16 rounded-lg px-8 text-base font-black text-white"
          disabled={!canPickDrawWinner || isDrawParticipantLoading}
          onClick={handlePickDrawWinner}
        >
          {isDrawParticipantLoading ? "조회 중" : isDrawing ? "추첨 중" : "추첨하기"}
        </Button>
      </div>

      <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          variant="outline"
          aria-pressed={isDrawFollowerOnly}
          className={cn(
            "h-10 rounded-xl px-3 text-sm font-black",
            isDrawFollowerOnly
              ? "bg-brand hover:bg-brand/90 text-white hover:text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
          disabled={isDrawing || isDrawParticipantLoading}
          onClick={() => setIsDrawFollowerOnly((current) => !current)}
        >
          {isDrawFollowerOnly ? <Check className="size-4" /> : null}
          구독자만 추첨하기
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-pressed={isDrawExcludePreviousWinners}
          className={cn(
            "h-10 rounded-xl px-3 text-sm font-black",
            isDrawExcludePreviousWinners
              ? "bg-brand hover:bg-brand/90 text-white hover:text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
          disabled={isDrawing || isDrawParticipantLoading}
          onClick={() => setIsDrawExcludePreviousWinners((current) => !current)}
        >
          {isDrawExcludePreviousWinners ? <Check className="size-4" /> : null}
          이미 뽑힌 참여자 제외하기
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-pressed={isDrawTimerEnabled}
          className={cn(
            "h-10 rounded-xl px-3 text-sm font-black",
            isDrawTimerEnabled
              ? "bg-brand hover:bg-brand/90 text-white hover:text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
          disabled={isDrawing || isDrawParticipantLoading}
          onClick={() => setIsDrawTimerEnabled((current) => !current)}
        >
          {isDrawTimerEnabled ? <Check className="size-4" /> : null}
          타이머 사용하기
        </Button>
        <div className="flex items-center justify-center gap-2">
          <Input
            type="number"
            min={0}
            max={DRAW_TIMER_MAX_SECONDS}
            value={drawTimerSeconds}
            disabled={!isDrawTimerEnabled || isDrawing || isDrawParticipantLoading}
            className="border-border bg-muted/30 h-10 w-25 rounded-xl text-center text-sm font-bold"
            onChange={(event) => handleDrawTimerSecondsChange(event.target.value)}
          />
          <span className="text-foreground text-sm font-bold">초</span>
        </div>
      </div>

      <div className="border-border bg-background/60 flex min-h-0 flex-1 flex-col rounded-lg border">
        {isDrawing && drawReelNames.length > 0 ? (
          <div className="relative m-auto h-10 w-full max-w-md overflow-hidden px-4">
            <div className="from-background pointer-events-none absolute inset-x-4 top-0 z-10 h-3 bg-linear-to-b to-transparent" />
            <div className="from-background pointer-events-none absolute inset-x-4 bottom-0 z-10 h-3 bg-linear-to-t to-transparent" />
            <div
              className="flex flex-col transition-transform ease-out"
              style={{
                transform: `translateY(-${drawReelTargetIndex * DRAW_REEL_ROW_HEIGHT_PX}px)`,
                transitionDuration: `${DRAW_REEL_DURATION_MS - 150}ms`,
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {drawReelNames.map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="text-live flex h-10 items-center justify-center text-lg font-black"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {drawWinnerNames.length ? (
              <div className="border-border mb-4 flex flex-wrap items-center gap-2 border-b pb-4">
                <span className="text-brand text-sm font-black">당첨자</span>
                {drawWinnerNames.map((winnerName, index) => (
                  <span
                    key={`${winnerName}-${index}`}
                    className="bg-brand/10 text-brand rounded-lg px-3 py-2 text-sm font-black"
                  >
                    {index + 1}. {winnerName}
                  </span>
                ))}
              </div>
            ) : null}

            {drawParticipants.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {drawParticipants.map((participant) => (
                  <span
                    key={participant}
                    className="bg-muted/50 text-foreground rounded-lg px-3 py-2 text-sm font-bold"
                  >
                    {participant}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-72 items-center justify-center text-center">
                <p className="text-muted-foreground text-sm font-semibold">
                  {drawRollingName
                    ? `최근 당첨자 ${drawRollingName}`
                    : drawSession?.endedAt
                      ? "모집된 후보가 없습니다."
                      : drawSession
                        ? "시청자가 추첨 참여 버튼을 누르면 후보에 들어갑니다."
                        : "모집하기를 누르면 시청자가 추첨 참여 버튼으로 후보에 들어갑니다."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <span className="text-foreground text-sm font-black">총 {drawParticipants.length}명</span>
      </div>
    </div>
  );
}
