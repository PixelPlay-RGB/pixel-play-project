"use client";
// 투표 참여 Dialog를 채팅 패널 액션으로 제공합니다.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LIVE_LABEL, LIVE_VOTE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type { LivePoll } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
  isLoading?: boolean;
  isError?: boolean;
  onLoginPrompt: () => void;
  isLoggedIn: boolean;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
}

interface VoteContentProps {
  activePoll: LivePoll;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  onClose: () => void;
}

function VoteContent({ activePoll, onVote, onClose }: VoteContentProps) {
  const hasVoted = !!activePoll.userVotedOptionId;
  const [selectedOption, setSelectedOption] = useState<string | null>(
    activePoll.userVotedOptionId ?? null,
  );
  const [isVoting, setIsVoting] = useState(false);

  async function handleVote() {
    if (!selectedOption || isVoting) return;
    setIsVoting(true);
    const success = await onVote(activePoll.id, selectedOption);
    setIsVoting(false);
    if (success) onClose();
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-foreground text-sm font-medium">{activePoll.title}</p>
        <div className="flex flex-col gap-2">
          {activePoll.options.map((option, index) => {
            const pct =
              activePoll.totalCount > 0
                ? Math.round((option.count / activePoll.totalCount) * 100)
                : 0;
            const isSelected = selectedOption === option.id;
            return (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                aria-pressed={isSelected}
                onClick={() => setSelectedOption(option.id)}
                className={cn(
                  "h-auto w-full flex-col items-start gap-1.5 px-3 py-2.5",
                  isSelected
                    ? "border-brand bg-brand/10 text-brand"
                    : "hover:border-brand/40 hover:bg-muted/40",
                )}
              >
                <div className="flex w-full items-center justify-between text-sm">
                  <span>{index + 1}. {option.label}</span>
                  <span className={cn("tabular-nums text-xs", isSelected ? "text-brand/70" : "text-muted-foreground")}>
                    {option.count.toLocaleString()}{LIVE_VOTE_LABEL.voteCountUnit} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isSelected ? "bg-brand" : "bg-foreground/20",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Button>
            );
          })}
        </div>
        <span className="text-muted-foreground text-xs">
          {activePoll.totalCount.toLocaleString()}
          {LIVE_VOTE_LABEL.totalCount}
        </span>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {LIVE_LABEL.cancel}
        </Button>
        <Button
          type="button"
          disabled={!selectedOption || isVoting || (hasVoted && selectedOption === activePoll.userVotedOptionId)}
          onClick={() => void handleVote()}
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
        >
          {isVoting
            ? LIVE_VOTE_LABEL.submitting
            : hasVoted && selectedOption !== activePoll.userVotedOptionId
            ? LIVE_VOTE_LABEL.change
            : hasVoted
            ? LIVE_VOTE_LABEL.participated
            : LIVE_VOTE_LABEL.submit}
        </Button>
      </DialogFooter>
    </>
  );
}

export function LiveVotePopover({
  polls,
  isLoading,
  isError,
  onLoginPrompt,
  isLoggedIn,
  onVote,
}: Props) {
  const [open, setOpen] = useState(false);
  const activePoll = polls.find((p) => p.status === "active") ?? null;

  function handleOpen() {
    if (!isLoggedIn) {
      onLoginPrompt();
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleOpen}>
        {LIVE_LABEL.vote}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-4" showCloseButton>
          <DialogHeader>
            <DialogTitle>{LIVE_VOTE_LABEL.title}</DialogTitle>
            <DialogDescription>{LIVE_VOTE_LABEL.description}</DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.loading}</p>
          ) : isError ? (
            <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.error}</p>
          ) : !activePoll ? (
            <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.empty}</p>
          ) : (
            <VoteContent
              key={activePoll.id}
              activePoll={activePoll}
              onVote={onVote}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
