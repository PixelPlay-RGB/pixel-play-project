"use client";
// 방송 운영 투표 도구 화면 — 진행 현황과 생성 폼을 렌더링합니다.

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POLL_TIMER_MAX_SECONDS } from "@/constants/channel/live-interaction";
import type { ChannelLiveVoteTool } from "@/hooks/channel/use-channel-live-vote-tool";

interface Props {
  isPollLoading: boolean;
  tool: ChannelLiveVoteTool;
}

export function ChannelLiveVoteToolView({ isPollLoading, tool }: Props) {
  const {
    canCreatePoll,
    handleAddOption,
    handleCreatePoll,
    handleEndPoll,
    handleOptionChange,
    handlePollTimerSecondsChange,
    handleRemoveOption,
    isPollActionPending,
    isPollTimerEnabled,
    options,
    pollResults,
    pollTimerSeconds,
    setIsPollFormOpen,
    setIsPollTimerEnabled,
    setTitle,
    title,
    totalVotes,
    visiblePoll,
  } = tool;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {isPollLoading ? (
        <div className="border-border text-muted-foreground flex min-h-32 items-center justify-center rounded-xl border text-sm font-semibold">
          투표를 불러오는 중입니다.
        </div>
      ) : visiblePoll ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <strong className="text-sm leading-5">{visiblePoll.title}</strong>
              <p className="text-muted-foreground mt-1 text-xs font-semibold">
                {visiblePoll.status === "ended"
                  ? "투표가 종료되었습니다."
                  : "시청자는 투표 참여 버튼으로 참여합니다."}
              </p>
            </div>
            {visiblePoll.status === "ended" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl font-bold"
                onClick={() => setIsPollFormOpen(true)}
              >
                새 투표
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl font-bold"
                disabled={isPollActionPending}
                onClick={() => void handleEndPoll()}
              >
                {isPollActionPending ? "종료 중" : "종료"}
              </Button>
            )}
          </div>
          <div className="grid gap-2 overflow-y-auto pr-1">
            {pollResults.map((result, index) => (
              <div
                key={`${result.option}-${index}`}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3"
              >
                <span className="text-foreground truncate text-sm font-black">{result.option}</span>
                <div className="bg-muted relative h-11 overflow-hidden rounded-xl">
                  <div
                    className="bg-brand absolute inset-y-0 left-0 rounded-xl transition-all"
                    style={{ width: `${result.percent}%` }}
                  />
                  <span className="text-foreground relative z-10 flex h-full items-center justify-end px-3 text-xs font-black tabular-nums">
                    {result.count}표 · {result.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <span className="text-muted-foreground text-xs font-semibold">
            현재 집계 {totalVotes}표
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleCreatePoll}
          className="border-border flex min-h-0 flex-1 flex-col gap-4 border-t pt-4"
        >
          <div className="grid grid-cols-[4.25rem_minmax(0,1fr)_2.5rem] items-center gap-2">
            <label htmlFor="channel-live-poll-title" className="text-foreground text-sm font-black">
              제목
            </label>
            <Input
              id="channel-live-poll-title"
              value={title}
              maxLength={50}
              placeholder="투표 제목을 입력해주세요."
              className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
              onChange={(event) => setTitle(event.target.value)}
            />
            <span aria-hidden />
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {options.map((option, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[4.25rem_minmax(0,1fr)_2.5rem] items-center gap-2"
                >
                  <span className="text-foreground text-sm font-black">항목 {index + 1}</span>
                  <Input
                    value={option}
                    maxLength={24}
                    placeholder="투표 이름"
                    className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                    onChange={(event) => handleOptionChange(index, event.target.value)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground rounded-xl"
                    disabled={options.length <= 2}
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="size-5" />
                    <span className="sr-only">항목 삭제</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-11 w-full rounded-xl font-bold"
              disabled={options.length >= 5}
              onClick={handleAddOption}
            >
              <Plus className="size-3.5" />
              항목 추가
            </Button>
            <label className="text-foreground flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={isPollTimerEnabled}
                className="accent-brand size-4"
                onChange={(event) => setIsPollTimerEnabled(event.target.checked)}
              />
              타이머 사용하기
            </label>
            <div className="flex items-center justify-end gap-2">
              <Input
                type="number"
                min={0}
                max={POLL_TIMER_MAX_SECONDS}
                value={pollTimerSeconds}
                disabled={!isPollTimerEnabled}
                className="border-border bg-muted/30 h-10 w-25 rounded-xl text-center text-sm font-bold"
                onChange={(event) => handlePollTimerSecondsChange(event.target.value)}
              />
              <span className="text-foreground text-sm font-bold">초</span>
            </div>
            <Button
              type="submit"
              disabled={!canCreatePoll || isPollActionPending}
              className="bg-brand hover:bg-brand/90 text-brand-foreground h-11 rounded-xl px-7 font-bold shadow-sm transition-all active:scale-95"
            >
              {isPollActionPending ? "시작 중" : "투표 시작"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
