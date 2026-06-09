"use client";
// 투표 참여와 라이브 상호작용 결과를 채팅 패널 액션 팝오버로 제공합니다.

import { useId, useState } from "react";
import { Check, Crown, Gift, Trophy } from "lucide-react";

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
import type { LiveInteractionNotice, LivePoll, LivePollOption } from "@/types/live/live";

interface Props {
  interactionNotices?: LiveInteractionNotice[];
  isError?: boolean;
  isInteractionNoticesError?: boolean;
  isInteractionNoticesLoading?: boolean;
  isLoading?: boolean;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  polls: LivePoll[];
  presentation?: "popover" | "dialog";
}

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

function getSelectedOption(poll: LivePoll): LivePollOption | null {
  return poll.options.find((option) => option.id === poll.userVotedOptionId) ?? null;
}

function StatusPill({ children, tone }: { children: string; tone: "brand" | "live" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold",
        tone === "brand" && "bg-brand/10 text-brand",
        tone === "live" && "bg-live/10 text-live",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function VoteOptionBar({ percent, emphasized }: { emphasized: boolean; percent: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-0 transition-all duration-300",
        emphasized ? "bg-brand/20" : "bg-muted",
      )}
      style={{ width: `${percent}%` }}
    />
  );
}

function StandbyCard() {
  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-3">
      <StatusPill tone="brand">상시 버튼</StatusPill>
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-bold">{LIVE_VOTE_LABEL.emptyTitle}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">{LIVE_VOTE_LABEL.emptyDesc}</p>
      </div>
      <Button type="button" variant="outline" disabled className="h-9 w-full">
        {LIVE_VOTE_LABEL.waiting}
      </Button>
    </div>
  );
}

function ActiveVoteCard({
  activePoll,
  onVote,
  onClose,
}: {
  activePoll: LivePoll;
  onClose: () => void;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
}) {
  const titleId = useId();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const total = activePoll.totalCount;
  const canSubmit = !!selectedOption && !isVoting;

  async function handleVote() {
    if (!selectedOption || isVoting) return;

    setIsVoting(true);
    const success = await onVote(activePoll.id, selectedOption);
    setIsVoting(false);

    if (success) onClose();
  }

  return (
    <div className="border-brand/40 flex flex-col gap-3 rounded-lg border p-3">
      <StatusPill tone="brand">{LIVE_VOTE_LABEL.active}</StatusPill>
      <p id={titleId} className="text-foreground text-sm font-bold">
        {activePoll.title}
      </p>
      <div role="radiogroup" aria-labelledby={titleId} className="flex flex-col gap-2">
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
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                "relative h-9 w-full justify-start overflow-hidden px-3 text-sm font-bold",
                isSelected ? "border-brand bg-brand/5 text-brand" : "hover:border-brand/40",
              )}
            >
              <VoteOptionBar percent={percent} emphasized={isSelected} />
              <span className="relative flex min-w-0 items-center gap-2">
                <span className="bg-brand/10 text-brand flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                  {index + 1}
                </span>
                <span className="truncate">{option.label}</span>
              </span>
            </Button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs font-semibold tabular-nums">
          {formatCount(total)}
          {LIVE_VOTE_LABEL.liveParticipantsSuffix}
        </span>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleVote()}
          className="bg-live hover:bg-live/90 text-live-foreground h-9 px-4 text-xs font-bold"
        >
          {isVoting ? LIVE_VOTE_LABEL.submitting : LIVE_VOTE_LABEL.confirmVote}
        </Button>
      </div>
    </div>
  );
}

function ParticipatedCard({ poll }: { poll: LivePoll }) {
  const selectedOption = getSelectedOption(poll);

  return (
    <div className="border-brand/40 flex flex-col gap-3 rounded-lg border p-3">
      <StatusPill tone="brand">{LIVE_VOTE_LABEL.participatedStatus}</StatusPill>
      <p className="text-foreground text-sm font-bold">{poll.title}</p>
      <div className="flex flex-col gap-2">
        {poll.options.map((option, index) => {
          const isSelected = option.id === poll.userVotedOptionId;

          return (
            <div
              key={option.id}
              className={cn(
                "border-border flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-bold",
                isSelected && "border-brand bg-brand/5 text-brand",
              )}
            >
              <span className="bg-brand/10 text-brand flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {isSelected ? `${option.label}${LIVE_VOTE_LABEL.selectedSuffix}` : option.label}
              </span>
              {isSelected ? <Check className="size-4 shrink-0" /> : null}
            </div>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs font-semibold">
        {selectedOption ? LIVE_VOTE_LABEL.waitForResult : LIVE_VOTE_LABEL.waitForResultFallback}
      </p>
      <Button type="button" disabled className="bg-live/80 h-9 w-full text-xs font-bold">
        {LIVE_VOTE_LABEL.participated}
      </Button>
    </div>
  );
}

function VoteResults({ poll, onClose }: { onClose: () => void; poll: LivePoll }) {
  const total = poll.totalCount;
  const maxCount = getMaxCount(poll.options);

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-3">
      <StatusPill tone="muted">{LIVE_VOTE_LABEL.ended}</StatusPill>
      <p className="text-foreground text-sm font-bold">{poll.title}</p>
      <div className="flex flex-col gap-2">
        {poll.options.map((option) => {
          const percent = getVotePercent(option.count, total);
          const isWinner = option.count > 0 && option.count === maxCount;

          return (
            <div key={option.id} className="border-border rounded-lg border px-3 py-2">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                {isWinner ? <Crown aria-hidden className="text-live size-4 shrink-0" /> : null}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                <span className="shrink-0 text-xs tabular-nums">
                  {formatCount(option.count)}
                  {LIVE_VOTE_LABEL.votesUnit} · {percent}%
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className={cn("h-full rounded-full", isWinner ? "bg-live" : "bg-brand")}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-border flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-bold">
        <span>{LIVE_VOTE_LABEL.totalPrefix}</span>
        <span>
          {formatCount(total)}
          {LIVE_VOTE_LABEL.participantsUnit}
        </span>
      </div>
      <Button type="button" variant="outline" className="h-9 w-full" onClick={onClose}>
        {LIVE_LABEL.close}
      </Button>
    </div>
  );
}

function InteractionNoticeList({
  isError,
  isLoading,
  notices,
}: {
  isError?: boolean;
  isLoading?: boolean;
  notices: LiveInteractionNotice[];
}) {
  if (isLoading) {
    return <p className="text-muted-foreground text-xs">{LIVE_VOTE_LABEL.resultLoading}</p>;
  }

  if (isError) {
    return <p className="text-muted-foreground text-xs">{LIVE_VOTE_LABEL.resultError}</p>;
  }

  if (notices.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground text-xs font-bold">{LIVE_VOTE_LABEL.recentResults}</p>
      {notices.slice(0, 3).map((notice) => {
        const Icon = notice.type === "draw" ? Trophy : Gift;
        const title =
          notice.type === "draw" ? LIVE_VOTE_LABEL.drawResult : LIVE_VOTE_LABEL.rouletteResult;
        const detail = notice.winnerNames?.join(", ") ?? notice.resultLabel ?? notice.content;

        return (
          <div key={notice.id} className="border-border rounded-lg border px-3 py-2">
            <div className="mb-1 flex items-center gap-2">
              <Icon className="text-brand size-4 shrink-0" />
              <span className="text-foreground text-xs font-bold">{title}</span>
            </div>
            <p className="text-foreground text-sm font-bold wrap-break-word">{detail}</p>
            {notice.participantCount !== undefined ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {formatCount(notice.participantCount)}
                {LIVE_VOTE_LABEL.participantsUnit}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function VoteBody({
  interactionNotices,
  isError,
  isInteractionNoticesError,
  isInteractionNoticesLoading,
  isLoading,
  isLoggedIn,
  onClose,
  onLoginPrompt,
  onVote,
  relevantPoll,
}: {
  interactionNotices: LiveInteractionNotice[];
  isError?: boolean;
  isInteractionNoticesError?: boolean;
  isInteractionNoticesLoading?: boolean;
  isLoading?: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onLoginPrompt: () => void;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  relevantPoll: LivePoll | null;
}) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.loading}</p>;
  }

  if (isError) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.error}</p>;
  }

  const noticeList = (
    <InteractionNoticeList
      notices={interactionNotices}
      isLoading={isInteractionNoticesLoading}
      isError={isInteractionNoticesError}
    />
  );

  if (!relevantPoll) {
    return (
      <div className="flex flex-col gap-4">
        <StandbyCard />
        {noticeList}
      </div>
    );
  }

  if (relevantPoll.status === "ended") {
    return (
      <div className="flex flex-col gap-4">
        <VoteResults poll={relevantPoll} onClose={onClose} />
        {noticeList}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-4">
        <div className="border-border flex flex-col gap-3 rounded-lg border p-3">
          <StatusPill tone="brand">{LIVE_VOTE_LABEL.active}</StatusPill>
          <p className="text-foreground text-sm font-bold">{relevantPoll.title}</p>
          <p className="text-muted-foreground text-sm">{LIVE_LABEL.loginDescription}</p>
          <Button
            type="button"
            onClick={() => {
              onClose();
              onLoginPrompt();
            }}
            className="bg-brand hover:bg-brand/90 text-brand-foreground h-9 w-full"
          >
            {LIVE_LABEL.loginButton}
          </Button>
        </div>
        {noticeList}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {relevantPoll.userVotedOptionId ? (
        <ParticipatedCard poll={relevantPoll} />
      ) : (
        <ActiveVoteCard activePoll={relevantPoll} onVote={onVote} onClose={onClose} />
      )}
      {noticeList}
    </div>
  );
}

export function LiveVotePopover({
  interactionNotices = [],
  isError,
  isInteractionNoticesError,
  isInteractionNoticesLoading,
  isLoading,
  isLoggedIn,
  onLoginPrompt,
  onVote,
  polls,
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
    if (next && !isLoggedIn && relevantPoll?.status === "active") {
      onLoginPrompt();
      return;
    }

    setOpen(next);
  }

  function handleOpen() {
    handleOpenChange(true);
  }

  const body = (
    <VoteBody
      interactionNotices={interactionNotices}
      isLoading={isLoading}
      isError={isError}
      isInteractionNoticesLoading={isInteractionNoticesLoading}
      isInteractionNoticesError={isInteractionNoticesError}
      relevantPoll={relevantPoll}
      isLoggedIn={isLoggedIn}
      onLoginPrompt={onLoginPrompt}
      onVote={onVote}
      onClose={() => setOpen(false)}
    />
  );

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
            {body}
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
        {body}
      </PopoverContent>
    </Popover>
  );
}
