"use client";
// 투표 참여와 라이브 상호작용 결과를 채팅 패널 액션 팝오버로 제공합니다.

import { useId, useState } from "react";
import { Check, Crown, FerrisWheel, Trophy } from "lucide-react";

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
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  polls: LivePoll[];
  presentation?: "popover" | "dialog";
}

type CurrentInteraction =
  | { type: "empty" }
  | { createdAt: string; mode: "active" | "result"; poll: LivePoll; type: "poll" }
  | {
      createdAt: string;
      mode: "active" | "result";
      notice: LiveInteractionNotice;
      type: "draw" | "roulette";
    };

function getCreatedTime(value: string): number {
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function selectLatestByCreatedAt<T extends { createdAt: string }>(items: T[]): T | null {
  return items.reduce<T | null>((latestItem, item) => {
    if (!latestItem) return item;

    return getCreatedTime(item.createdAt) > getCreatedTime(latestItem.createdAt)
      ? item
      : latestItem;
  }, null);
}

function selectCurrentInteraction(
  polls: LivePoll[],
  notices: LiveInteractionNotice[],
): CurrentInteraction {
  const latestActivePoll = selectLatestByCreatedAt(
    polls.filter((poll) => poll.status === "active"),
  );
  const latestNoticeByType = {
    draw: selectLatestByCreatedAt(notices.filter((notice) => notice.type === "draw")),
    roulette: selectLatestByCreatedAt(notices.filter((notice) => notice.type === "roulette")),
  };
  const latestActiveNotice = selectLatestByCreatedAt(
    [latestNoticeByType.draw, latestNoticeByType.roulette].flatMap((notice) =>
      notice?.status === "active" ? [notice] : [],
    ),
  );
  const latestActiveInteraction = selectLatestByCreatedAt(
    [
      latestActivePoll
        ? {
            createdAt: latestActivePoll.createdAt,
            mode: "active" as const,
            poll: latestActivePoll,
            type: "poll" as const,
          }
        : null,
      latestActiveNotice
        ? {
            createdAt: latestActiveNotice.createdAt,
            mode: "active" as const,
            notice: latestActiveNotice,
            type: latestActiveNotice.type,
          }
        : null,
    ].flatMap((interaction) => (interaction ? [interaction] : [])),
  );

  if (latestActiveInteraction) {
    return latestActiveInteraction;
  }

  const latestEndedPollInteraction = selectLatestByCreatedAt(
    polls
      .filter((poll) => poll.status === "ended")
      .map((poll) => ({
        createdAt: poll.endedAt ?? poll.createdAt,
        mode: "result" as const,
        poll,
        type: "poll" as const,
      })),
  );
  const latestEndedNotice = selectLatestByCreatedAt(
    [latestNoticeByType.draw, latestNoticeByType.roulette].flatMap((notice) =>
      notice?.status === "ended" ? [notice] : [],
    ),
  );
  const latestResultInteraction = selectLatestByCreatedAt(
    [
      latestEndedPollInteraction,
      latestEndedNotice
        ? {
            createdAt: latestEndedNotice.createdAt,
            mode: "result" as const,
            notice: latestEndedNotice,
            type: latestEndedNotice.type,
          }
        : null,
    ].flatMap((interaction) => (interaction ? [interaction] : [])),
  );

  return latestResultInteraction ?? { type: "empty" };
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
    <div className="flex flex-col overflow-hidden">
      <div className="border-border flex flex-col gap-2 border-t border-dashed pt-3 pb-3">
        <StatusPill tone="brand">{LIVE_VOTE_LABEL.active}</StatusPill>
        <p id={titleId} className="text-foreground text-sm font-bold">
          {activePoll.title}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={titleId}
        className="border-border flex flex-col gap-2 border-t border-dashed py-3"
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
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                "relative h-9 w-full justify-start overflow-hidden px-3 text-sm font-bold transition-all",
                isSelected
                  ? "border-brand bg-brand/10 text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                  : "hover:border-brand/40",
              )}
            >
              <VoteOptionBar percent={percent} emphasized={isSelected} />
              <span className="relative flex min-w-0 flex-1 items-center gap-2">
                <span className="bg-brand/10 text-brand flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                  {index + 1}
                </span>
                <span className="truncate">{option.label}</span>
              </span>
              {isSelected ? <Check className="relative size-4 shrink-0" /> : null}
            </Button>
          );
        })}
      </div>
      <div className="border-border flex items-center justify-between gap-3 border-t border-dashed pt-3">
        <span className="text-muted-foreground text-xs font-semibold tabular-nums">
          {formatCount(total)}
          {LIVE_VOTE_LABEL.liveParticipantsSuffix}
        </span>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleVote()}
          className="bg-brand hover:bg-brand/90 text-brand-foreground h-9 px-4 text-xs font-bold"
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
    <div className="flex flex-col overflow-hidden">
      <div className="border-border flex flex-col gap-2 border-t border-dashed pt-3 pb-3">
        <StatusPill tone="brand">{LIVE_VOTE_LABEL.participatedStatus}</StatusPill>
        <p className="text-foreground text-sm font-bold">{poll.title}</p>
      </div>
      <div className="border-border flex flex-col gap-2 border-t border-dashed py-3">
        {poll.options.map((option, index) => {
          const isSelected = option.id === poll.userVotedOptionId;

          return (
            <div
              key={option.id}
              className={cn(
                "border-border flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-bold",
                isSelected &&
                  "border-brand bg-brand/10 text-brand shadow-[inset_0_0_0_1px_var(--brand)]",
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
      <div className="border-border flex flex-col gap-3 border-t border-dashed pt-3">
        <p className="text-muted-foreground text-xs font-semibold">
          {selectedOption ? LIVE_VOTE_LABEL.waitForResult : LIVE_VOTE_LABEL.waitForResultFallback}
        </p>
        <Button
          type="button"
          disabled
          className="bg-brand/80 text-brand-foreground h-9 w-full text-xs font-bold"
        >
          {LIVE_VOTE_LABEL.participated}
        </Button>
      </div>
    </div>
  );
}

function VoteResults({ poll, onClose }: { onClose: () => void; poll: LivePoll }) {
  const total = poll.totalCount;
  const maxCount = getMaxCount(poll.options);

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="border-border flex flex-col gap-2 border-t border-dashed pt-3 pb-3">
        <StatusPill tone="brand">{LIVE_VOTE_LABEL.ended}</StatusPill>
        <p className="text-foreground text-sm font-bold">{poll.title}</p>
      </div>
      <div className="border-border flex flex-col gap-2 border-t border-dashed py-3">
        {poll.options.map((option) => {
          const percent = getVotePercent(option.count, total);
          const isWinner = option.count > 0 && option.count === maxCount;

          return (
            <div key={option.id} className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2">
              <div
                className={cn(
                  "flex min-w-0 items-center gap-1 text-sm font-black",
                  isWinner ? "text-brand" : "text-foreground",
                )}
              >
                {isWinner ? <Crown aria-hidden className="size-4 shrink-0" /> : null}
                <span className="truncate">{option.label}</span>
              </div>
              <div className="bg-muted relative h-10 overflow-hidden rounded-xl">
                <div
                  className="bg-brand absolute inset-y-0 left-0 rounded-xl transition-all"
                  style={{ width: `${percent}%` }}
                />
                <span className="text-foreground relative z-10 flex h-full items-center justify-end px-3 text-xs font-black tabular-nums">
                  {formatCount(option.count)}
                  {LIVE_VOTE_LABEL.votesUnit} · {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-border flex items-center justify-between border-t border-dashed pt-3 text-xs font-bold">
        <span>{LIVE_VOTE_LABEL.totalPrefix}</span>
        <span>
          {formatCount(total)}
          {LIVE_VOTE_LABEL.participantsUnit}
        </span>
      </div>
      <div className="border-border mt-3 border-t border-dashed pt-3">
        <Button type="button" variant="outline" className="h-9 w-full" onClick={onClose}>
          {LIVE_LABEL.close}
        </Button>
      </div>
    </div>
  );
}

function DrawNoticeBoard({
  hasJoined,
  notice,
}: {
  hasJoined: boolean;
  notice: LiveInteractionNotice;
}) {
  const winnerNames = notice.winnerNames ?? [];
  const participantCount = notice.participantCount ?? 0;

  return (
    <div className="border-border border-t border-dashed py-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-border bg-background/60 flex min-h-28 flex-col rounded-lg border p-3">
          <div className="border-border flex items-center justify-between gap-2 border-b pb-2">
            <span className="text-brand text-xs font-black">
              {LIVE_VOTE_LABEL.drawCandidatesTitle}
            </span>
            <span className="text-foreground text-xs font-black">
              총 {formatCount(participantCount)}명
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center text-center">
            <p
              className={cn(
                "text-xs font-bold",
                hasJoined ? "text-brand" : "text-muted-foreground",
              )}
            >
              {hasJoined
                ? LIVE_VOTE_LABEL.drawCandidateJoined
                : LIVE_VOTE_LABEL.drawCandidateWaiting}
            </p>
          </div>
        </div>
        <div className="border-border bg-background/60 flex min-h-28 flex-col rounded-lg border p-3">
          <div className="border-border flex items-center justify-between gap-2 border-b pb-2">
            <span className="text-live text-xs font-black">{LIVE_VOTE_LABEL.drawWinnerTitle}</span>
            <span className="text-foreground text-xs font-black">
              {formatCount(winnerNames.length)}명
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pt-2">
            {winnerNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {winnerNames.map((winnerName, index) => (
                  <span
                    key={`${winnerName}-${index}`}
                    className="bg-live/10 text-live rounded-lg px-2 py-1 text-xs font-black"
                  >
                    {index + 1}. {winnerName}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-16 items-center justify-center text-center">
                <p className="text-muted-foreground text-xs font-bold">
                  {LIVE_VOTE_LABEL.drawNoWinner}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractionNoticeCard({
  isLoggedIn,
  notice,
  onClose,
  onJoinDraw,
  onLoginPrompt,
}: {
  isLoggedIn: boolean;
  notice: LiveInteractionNotice;
  onClose: () => void;
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
  onLoginPrompt: () => void;
}) {
  const isActive = notice.status === "active";
  const [joinedDrawNoticeId, setJoinedDrawNoticeId] = useState<string | null>(null);
  const [isJoiningDraw, setIsJoiningDraw] = useState(false);
  const isDraw = notice.type === "draw";
  const Icon = notice.type === "draw" ? Trophy : FerrisWheel;
  const title = isDraw
    ? isActive
      ? LIVE_VOTE_LABEL.drawActiveTitle
      : LIVE_VOTE_LABEL.drawResult
    : isActive
      ? LIVE_VOTE_LABEL.rouletteActiveTitle
      : LIVE_VOTE_LABEL.rouletteResult;
  const description = isDraw
    ? LIVE_VOTE_LABEL.drawActiveDescription
    : LIVE_VOTE_LABEL.rouletteActiveDescription;
  const detail = notice.winnerNames?.join(", ") ?? notice.resultLabel ?? notice.content;
  const canJoinDraw = isActive && notice.type === "draw";
  const hasJoined = Boolean(notice.hasJoined) || joinedDrawNoticeId === notice.id;

  async function handleJoinDraw() {
    if (!canJoinDraw) {
      onClose();
      return;
    }

    if (!isLoggedIn) {
      onClose();
      onLoginPrompt();
      return;
    }

    if (!onJoinDraw || hasJoined || isJoiningDraw) return;

    setIsJoiningDraw(true);
    const success = await onJoinDraw(notice.id);
    setIsJoiningDraw(false);

    if (success) {
      setJoinedDrawNoticeId(notice.id);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {!isDraw ? (
        <>
          <div className="border-border flex flex-col gap-3 border-t border-dashed pt-3 pb-3">
            <StatusPill tone={isActive ? "brand" : "muted"}>
              {isActive ? LIVE_VOTE_LABEL.active : LIVE_VOTE_LABEL.ended}
            </StatusPill>
            <div className="flex items-center gap-2">
              <span className="bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-foreground text-sm font-bold">{title}</p>
                {isActive ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="border-border border-t border-dashed py-3">
            <p className="text-foreground text-sm font-bold wrap-break-word">{detail}</p>
            {notice.participantCount !== undefined ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {formatCount(notice.participantCount)}
                {LIVE_VOTE_LABEL.participantsUnit}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <DrawNoticeBoard hasJoined={hasJoined} notice={notice} />
      )}
      <div className="border-border border-t border-dashed pt-3">
        <Button
          type="button"
          variant={isActive ? "default" : "outline"}
          disabled={
            (isActive && !canJoinDraw) ||
            (canJoinDraw && isLoggedIn && (hasJoined || isJoiningDraw || !onJoinDraw))
          }
          className={cn(
            isActive && "bg-live/80 text-live-foreground",
            "h-9 w-full text-xs font-bold",
          )}
          onClick={() => void handleJoinDraw()}
        >
          {canJoinDraw
            ? isJoiningDraw
              ? LIVE_VOTE_LABEL.submitting
              : hasJoined
                ? LIVE_VOTE_LABEL.participated
                : LIVE_VOTE_LABEL.submit
            : isActive
              ? LIVE_VOTE_LABEL.active
              : LIVE_LABEL.close}
        </Button>
      </div>
    </div>
  );
}

function VoteBody({
  currentInteraction,
  isError,
  isInteractionNoticesError,
  isInteractionNoticesLoading,
  isLoading,
  isLoggedIn,
  onClose,
  onJoinDraw,
  onLoginPrompt,
  onVote,
}: {
  currentInteraction: CurrentInteraction;
  isError?: boolean;
  isInteractionNoticesError?: boolean;
  isInteractionNoticesLoading?: boolean;
  isLoading?: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
  onLoginPrompt: () => void;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
}) {
  if (currentInteraction.type === "empty" && (isLoading || isInteractionNoticesLoading)) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.loading}</p>;
  }

  if (currentInteraction.type === "empty" && (isError || isInteractionNoticesError)) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.error}</p>;
  }

  if (currentInteraction.type === "empty") {
    return <StandbyCard />;
  }

  if (currentInteraction.type === "draw" || currentInteraction.type === "roulette") {
    return (
      <InteractionNoticeCard
        isLoggedIn={isLoggedIn}
        notice={currentInteraction.notice}
        onClose={onClose}
        onJoinDraw={onJoinDraw}
        onLoginPrompt={onLoginPrompt}
      />
    );
  }

  if (currentInteraction.type !== "poll") {
    return null;
  }

  const pollInteraction = currentInteraction;

  if (pollInteraction.mode === "result") {
    return <VoteResults poll={pollInteraction.poll} onClose={onClose} />;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col overflow-hidden">
        <div className="border-border flex flex-col gap-2 border-t border-dashed pt-3 pb-3">
          <StatusPill tone="brand">{LIVE_VOTE_LABEL.active}</StatusPill>
          <p className="text-foreground text-sm font-bold">{pollInteraction.poll.title}</p>
        </div>
        <p className="border-border text-muted-foreground border-t border-dashed py-3 text-sm">
          {LIVE_LABEL.loginDescription}
        </p>
        <div className="border-border border-t border-dashed pt-3">
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
      </div>
    );
  }

  return pollInteraction.poll.userVotedOptionId ? (
    <ParticipatedCard poll={pollInteraction.poll} />
  ) : (
    <ActiveVoteCard activePoll={pollInteraction.poll} onVote={onVote} onClose={onClose} />
  );
}

function getTriggerLabel(currentInteraction: CurrentInteraction) {
  if (currentInteraction.type === "poll") {
    return currentInteraction.mode === "active" ? LIVE_LABEL.vote : LIVE_VOTE_LABEL.resultTitle;
  }

  if (currentInteraction.type === "draw") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.drawCheck
      : LIVE_VOTE_LABEL.drawResult;
  }

  if (currentInteraction.type === "roulette") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.rouletteCheck
      : LIVE_VOTE_LABEL.rouletteResult;
  }

  return LIVE_VOTE_LABEL.interactionTitle;
}

function getHeaderTitle(currentInteraction: CurrentInteraction) {
  if (currentInteraction.type === "poll") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.title
      : LIVE_VOTE_LABEL.resultTitle;
  }

  if (currentInteraction.type === "draw") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.drawActiveTitle
      : LIVE_VOTE_LABEL.drawResult;
  }

  if (currentInteraction.type === "roulette") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.rouletteActiveTitle
      : LIVE_VOTE_LABEL.rouletteResult;
  }

  return LIVE_VOTE_LABEL.interactionTitle;
}

function getHeaderDescription(currentInteraction: CurrentInteraction) {
  if (currentInteraction.type === "poll") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.description
      : LIVE_VOTE_LABEL.resultDescription;
  }

  if (currentInteraction.type === "draw") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.drawActiveDescription
      : LIVE_VOTE_LABEL.interactionResultDescription;
  }

  if (currentInteraction.type === "roulette") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.rouletteActiveDescription
      : LIVE_VOTE_LABEL.interactionResultDescription;
  }

  return LIVE_VOTE_LABEL.interactionDescription;
}

function shouldPromptLoginOnOpen(currentInteraction: CurrentInteraction) {
  return currentInteraction.type === "poll" && currentInteraction.mode === "active";
}

function shouldShowInteractionHeader(currentInteraction: CurrentInteraction) {
  return !(currentInteraction.type === "draw" && currentInteraction.mode === "active");
}

export function LiveVotePopover({
  interactionNotices = [],
  isError,
  isInteractionNoticesError,
  isInteractionNoticesLoading,
  isLoading,
  isLoggedIn,
  onJoinDraw,
  onLoginPrompt,
  onVote,
  polls,
  presentation = "popover",
}: Props) {
  const [open, setOpen] = useState(false);
  const currentInteraction = selectCurrentInteraction(polls, interactionNotices);
  const triggerLabel = getTriggerLabel(currentInteraction);
  const headerTitle = getHeaderTitle(currentInteraction);
  const headerDescription = getHeaderDescription(currentInteraction);
  const showHeader = shouldShowInteractionHeader(currentInteraction);

  function handleOpenChange(next: boolean) {
    if (next && !isLoggedIn && shouldPromptLoginOnOpen(currentInteraction)) {
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
      currentInteraction={currentInteraction}
      isLoading={isLoading}
      isError={isError}
      isInteractionNoticesLoading={isInteractionNoticesLoading}
      isInteractionNoticesError={isInteractionNoticesError}
      isLoggedIn={isLoggedIn}
      onJoinDraw={onJoinDraw}
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
            {showHeader ? (
              <DialogHeader>
                <DialogTitle>{headerTitle}</DialogTitle>
                <DialogDescription>{headerDescription}</DialogDescription>
              </DialogHeader>
            ) : null}
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
        {showHeader ? (
          <PopoverHeader>
            <PopoverTitle>{headerTitle}</PopoverTitle>
            <PopoverDescription>{headerDescription}</PopoverDescription>
          </PopoverHeader>
        ) : null}
        {body}
      </PopoverContent>
    </Popover>
  );
}
