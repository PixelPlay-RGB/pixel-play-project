"use client";
// 투표 참여(진행 중 실시간 중간집계)와 종료 후 결과를 채팅 패널 액션으로 제공합니다.

import { useId, useState } from "react";
import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LIVE_LABEL, LIVE_VOTE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { formatCount } from "@/utils/live/live-chat";
import type { LivePoll, LivePollOption } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
  isLoading?: boolean;
  isError?: boolean;
  onLoginPrompt: () => void;
  isLoggedIn: boolean;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  presentation?: "popover" | "dialog";
}

// 진행 중 투표를 우선 노출하고, 없으면 가장 최근 종료된 투표 결과를 노출한다.
// (목록은 created_at 오름차순이라 뒤에서부터 첫 종료 항목이 최신이다.)
function selectRelevantPoll(polls: LivePoll[]): LivePoll | null {
  const activePoll = polls.find((poll) => poll.status === "active");
  if (activePoll) return activePoll;

  for (let index = polls.length - 1; index >= 0; index -= 1) {
    if (polls[index].status === "ended") return polls[index];
  }

  return null;
}

function getVotePercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function getMaxCount(options: LivePollOption[]): number {
  return options.reduce((max, option) => Math.max(max, option.count), 0);
}

// 항목 뒤를 채우는 득표율 막대(진행 중·종료 결과 공용). emphasized면 라이브 톤.
function VoteOptionBar({ percent, emphasized }: { percent: number; emphasized: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-0 transition-all duration-300",
        emphasized ? "bg-live/20" : "bg-muted",
      )}
      style={{ width: `${percent}%` }}
    />
  );
}

interface VoteContentProps {
  activePoll: LivePoll;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  onClose: () => void;
}

// 진행 중: 선택 가능한 항목 + 실시간 중간집계(득표율 막대)를 함께 보여준다.
function VoteContent({ activePoll, onVote, onClose }: VoteContentProps) {
  const titleId = useId();
  const hintId = useId();
  const hasVoted = !!activePoll.userVotedOptionId;
  const [selectedOption, setSelectedOption] = useState<string | null>(
    activePoll.userVotedOptionId ?? null,
  );
  const [isVoting, setIsVoting] = useState(false);

  // 이미 투표한 항목과 다른 항목을 골라야 제출할 수 있습니다(투표 변경).
  const hasChanged = selectedOption !== (activePoll.userVotedOptionId ?? null);
  // 투표한 사용자가 선택을 해제하면(이미 누른 항목을 다시 클릭) 표 취소(unvote) 의도입니다.
  const isUnvote = hasVoted && selectedOption === null;
  const canSubmit = !isVoting && (isUnvote || (!!selectedOption && hasChanged));
  const total = activePoll.totalCount;

  async function handleVote() {
    if (!canSubmit) return;
    // 표 취소는 RPC에 기존 선택 항목을 그대로 보내면 됩니다(같은 항목 재선택 = 취소).
    const targetOptionId = isUnvote ? activePoll.userVotedOptionId : selectedOption;
    if (!targetOptionId) return;
    setIsVoting(true);
    const success = await onVote(activePoll.id, targetOptionId);
    setIsVoting(false);
    if (success) onClose();
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <p id={titleId} className="text-foreground text-sm font-medium">
          {activePoll.title}
        </p>
        {hasVoted ? (
          <p id={hintId} className="text-muted-foreground text-xs">
            {LIVE_VOTE_LABEL.changeHint}
          </p>
        ) : null}
        <div
          role="radiogroup"
          aria-labelledby={titleId}
          aria-describedby={hasVoted ? hintId : undefined}
          className="flex flex-col gap-2"
        >
          {activePoll.options.map((option, index) => {
            const isSelected = selectedOption === option.id;
            const percent = getVotePercent(option.count, total);
            return (
              <Button
                key={option.id}
                type="button"
                role="radio"
                variant="outline"
                aria-checked={isSelected}
                disabled={isVoting}
                onClick={() =>
                  setSelectedOption((prev) => (prev === option.id ? null : option.id))
                }
                className={cn(
                  "relative h-auto w-full justify-start overflow-hidden px-3 py-2.5",
                  isSelected ? "border-live text-live" : "hover:border-live/40",
                )}
              >
                <VoteOptionBar percent={percent} emphasized={isSelected} />
                <span className="relative flex w-full items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-left">
                    {index + 1}. {option.label}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {percent}% · {formatCount(option.count)}
                    {LIVE_VOTE_LABEL.votesUnit}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs tabular-nums">
          {formatCount(total)}
          {LIVE_VOTE_LABEL.liveParticipantsSuffix}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {LIVE_LABEL.cancel}
        </Button>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleVote()}
          className="bg-live hover:bg-live/90 text-live-foreground"
        >
          {isVoting
            ? LIVE_VOTE_LABEL.submitting
            : isUnvote
              ? LIVE_VOTE_LABEL.cancelVote
              : hasVoted
                ? hasChanged
                  ? LIVE_VOTE_LABEL.changeVote
                  : LIVE_VOTE_LABEL.participated
                : LIVE_VOTE_LABEL.submit}
        </Button>
      </div>
    </>
  );
}

// 종료: 읽기 전용 결과. 1위 강조, 내 선택 표시, 항목별 득표수·비율.
function VoteResults({ poll, onClose }: { poll: LivePoll; onClose: () => void }) {
  const total = poll.totalCount;
  const maxCount = getMaxCount(poll.options);

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-foreground text-sm font-medium">{poll.title}</p>
          <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
            {LIVE_VOTE_LABEL.ended}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {poll.options.map((option, index) => {
            const percent = getVotePercent(option.count, total);
            const isWinner = option.count > 0 && option.count === maxCount;
            const isUserChoice = poll.userVotedOptionId === option.id;
            return (
              <div
                key={option.id}
                className={cn(
                  "relative overflow-hidden rounded-md border px-3 py-2.5",
                  isWinner ? "border-live/60" : "border-border",
                )}
              >
                <VoteOptionBar percent={percent} emphasized={isWinner} />
                <div className="relative flex w-full items-center gap-2 text-sm">
                  {isWinner ? <Crown aria-hidden className="text-live size-4 shrink-0" /> : null}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-left",
                      isWinner && "text-live font-medium",
                    )}
                  >
                    {index + 1}. {option.label}
                  </span>
                  {isWinner ? (
                    <span className="bg-live/15 text-live shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium">
                      {LIVE_VOTE_LABEL.winner}
                    </span>
                  ) : null}
                  {isUserChoice ? (
                    <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-1.5 py-0.5 text-xs">
                      {LIVE_VOTE_LABEL.yourChoice}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-xs font-medium tabular-nums">
                    {percent}% · {formatCount(option.count)}
                    {LIVE_VOTE_LABEL.votesUnit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs tabular-nums">
          {LIVE_VOTE_LABEL.totalPrefix} {formatCount(total)}
          {LIVE_VOTE_LABEL.participantsUnit}
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          {LIVE_LABEL.confirm}
        </Button>
      </div>
    </>
  );
}

function VoteBody({
  isLoading,
  isError,
  relevantPoll,
  isLoggedIn,
  onLoginPrompt,
  onVote,
  onClose,
}: {
  isLoading?: boolean;
  isError?: boolean;
  relevantPoll: LivePoll | null;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  onClose: () => void;
}) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.loading}</p>;
  }

  if (isError) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.error}</p>;
  }

  if (!relevantPoll) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.empty}</p>;
  }

  if (relevantPoll.status === "ended") {
    return <VoteResults poll={relevantPoll} onClose={onClose} />;
  }

  // 진행 중 투표는 참여에 로그인이 필요하다. (결과 열람 중 realtime으로 새 투표가 시작된 경우 등)
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-foreground text-sm font-medium">{relevantPoll.title}</p>
        <p className="text-muted-foreground text-sm">{LIVE_LABEL.loginDescription}</p>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => {
              onClose();
              onLoginPrompt();
            }}
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            {LIVE_LABEL.loginButton}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <VoteContent
      key={`${relevantPoll.id}:${relevantPoll.userVotedOptionId ?? "none"}`}
      activePoll={relevantPoll}
      onVote={onVote}
      onClose={onClose}
    />
  );
}

export function LiveVotePopover({
  polls,
  isLoading,
  isError,
  onLoginPrompt,
  isLoggedIn,
  onVote,
  presentation = "popover",
}: Props) {
  const [open, setOpen] = useState(false);
  const relevantPoll = selectRelevantPoll(polls);
  const isResult = relevantPoll?.status === "ended";

  const triggerLabel = isResult ? LIVE_VOTE_LABEL.resultTitle : LIVE_LABEL.vote;
  const headerTitle = isResult ? LIVE_VOTE_LABEL.resultTitle : LIVE_VOTE_LABEL.title;
  const headerDescription = isResult
    ? LIVE_VOTE_LABEL.resultDescription
    : LIVE_VOTE_LABEL.description;

  function handleOpenChange(next: boolean) {
    // 결과 열람은 로그인 불필요. 진행 중 투표 참여만 로그인을 요구한다.
    if (next && !isLoggedIn && relevantPoll?.status === "active") {
      onLoginPrompt();
      return;
    }
    setOpen(next);
  }

  function handleOpen() {
    handleOpenChange(true);
  }

  if (presentation === "dialog") {
    return (
      <>
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleOpen}>
          {triggerLabel}
        </Button>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="max-h-[calc(100vh-1rem)] gap-4 overflow-y-auto" showCloseButton>
            <DialogHeader>
              <DialogTitle>{headerTitle}</DialogTitle>
              <DialogDescription>{headerDescription}</DialogDescription>
            </DialogHeader>
            <VoteBody
              isLoading={isLoading}
              isError={isError}
              relevantPoll={relevantPoll}
              isLoggedIn={isLoggedIn}
              onLoginPrompt={onLoginPrompt}
              onVote={onVote}
              onClose={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={<Button size="sm" variant="outline" className="flex-1 text-xs" />}>
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="max-h-[calc(100vh-1rem)] w-[calc((var(--anchor-width)*2)+0.5rem)] max-w-[calc(100vw-1rem)] gap-4 overflow-y-auto"
      >
        <PopoverHeader>
          <PopoverTitle>{headerTitle}</PopoverTitle>
          <PopoverDescription>{headerDescription}</PopoverDescription>
        </PopoverHeader>
        <VoteBody
          isLoading={isLoading}
          isError={isError}
          relevantPoll={relevantPoll}
          isLoggedIn={isLoggedIn}
          onLoginPrompt={onLoginPrompt}
          onVote={onVote}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
