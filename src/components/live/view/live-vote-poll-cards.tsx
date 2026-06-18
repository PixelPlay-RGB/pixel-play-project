// 라이브 투표 팝오버의 투표 모드 카드(대기·진행·참여완료·결과)를 제공합니다.
import { useId, useState } from "react";
import { Check, Crown } from "lucide-react";

import {
  InteractionHeader,
  StatusPill,
  VoteOptionBar,
  getVoteOptionClass,
} from "@/components/live/view/live-vote-shared";
import { Button } from "@/components/ui/button";
import { LIVE_VOTE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { getMaxCount, getVotePercent } from "@/utils/live/live-vote";
import { formatCount } from "@/utils/live/live-chat";
import type { LivePoll } from "@/types/live/live";

export function StandbyCard() {
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

export function ActiveVoteCard({
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
    await onVote(activePoll.id, selectedOption);
    setIsVoting(false);
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <InteractionHeader
        title="투표"
        titleId={titleId}
        status={LIVE_VOTE_LABEL.active}
        tone="brand"
        onClose={onClose}
      />
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
              className={getVoteOptionClass(isSelected)}
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

export function ParticipatedCard({ onClose, poll }: { onClose: () => void; poll: LivePoll }) {
  const total = poll.totalCount;

  return (
    <div className="flex flex-col overflow-hidden">
      <InteractionHeader
        title="투표"
        status={LIVE_VOTE_LABEL.active}
        tone="brand"
        onClose={onClose}
      />
      <div className="border-border flex flex-col gap-2 border-t border-dashed py-3">
        {poll.options.map((option, index) => {
          const isSelected = option.id === poll.userVotedOptionId;
          const percent = getVotePercent(option.count, total);

          return (
            <div key={option.id} className={getVoteOptionClass(isSelected)}>
              <VoteOptionBar percent={percent} emphasized={isSelected} />
              <span className="relative flex min-w-0 flex-1 items-center gap-2">
                <span className="bg-brand/10 text-brand flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {isSelected ? `${option.label}${LIVE_VOTE_LABEL.selectedSuffix}` : option.label}
                </span>
              </span>
              {isSelected ? <Check className="size-4 shrink-0" /> : null}
            </div>
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
          disabled
          className="bg-brand/80 text-brand-foreground h-9 px-4 text-xs font-bold"
        >
          {LIVE_VOTE_LABEL.participated}
        </Button>
      </div>
    </div>
  );
}

export function VoteResults({ poll, onClose }: { onClose: () => void; poll: LivePoll }) {
  const total = poll.totalCount;
  const maxCount = getMaxCount(poll.options);

  return (
    <div className="flex flex-col overflow-hidden">
      <InteractionHeader
        title="투표"
        status={LIVE_VOTE_LABEL.ended}
        tone="muted"
        onClose={onClose}
      />
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
    </div>
  );
}
