"use client";
// 투표 참여 Dialog를 채팅 패널 액션으로 제공합니다.

import { useState } from "react";
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
import type { LivePoll } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
  isLoading?: boolean;
  isError?: boolean;
  onLoginPrompt: () => void;
  isLoggedIn: boolean;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  presentation?: "popover" | "dialog";
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
            const isSelected = selectedOption === option.id;
            const isDisabledByVote = hasVoted && option.id !== activePoll.userVotedOptionId;
            return (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                aria-pressed={isSelected}
                disabled={isVoting || isDisabledByVote}
                onClick={() => setSelectedOption(option.id)}
                className={cn(
                  "h-auto w-full flex-col items-start gap-1.5 px-3 py-2.5",
                  isSelected
                    ? "border-brand bg-brand/10 text-brand"
                    : "hover:border-brand/40 hover:bg-muted/40",
                )}
              >
                <div className="flex w-full items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-left">
                    {index + 1}. {option.label}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {LIVE_LABEL.cancel}
        </Button>
        <Button
          type="button"
          disabled={!selectedOption || isVoting || hasVoted}
          onClick={() => void handleVote()}
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
        >
          {isVoting
            ? LIVE_VOTE_LABEL.submitting
            : hasVoted
              ? LIVE_VOTE_LABEL.participated
              : LIVE_VOTE_LABEL.submit}
        </Button>
      </div>
    </>
  );
}

function VoteBody({
  isLoading,
  isError,
  activePoll,
  onVote,
  onClose,
}: {
  isLoading?: boolean;
  isError?: boolean;
  activePoll: LivePoll | null;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  onClose: () => void;
}) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.loading}</p>;
  }

  if (isError) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.error}</p>;
  }

  if (!activePoll) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.empty}</p>;
  }

  return (
    <VoteContent key={activePoll.id} activePoll={activePoll} onVote={onVote} onClose={onClose} />
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
  const activePoll = polls.find((p) => p.status === "active") ?? null;

  function handleOpenChange(next: boolean) {
    if (next && !isLoggedIn) {
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
          {LIVE_LABEL.vote}
        </Button>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="max-h-[calc(100vh-1rem)] gap-4 overflow-y-auto" showCloseButton>
            <DialogHeader>
              <DialogTitle>{LIVE_VOTE_LABEL.title}</DialogTitle>
              <DialogDescription>{LIVE_VOTE_LABEL.description}</DialogDescription>
            </DialogHeader>
            <VoteBody
              isLoading={isLoading}
              isError={isError}
              activePoll={activePoll}
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
        {LIVE_LABEL.vote}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="max-h-[calc(100vh-1rem)] w-[calc((var(--anchor-width)*2)+0.5rem)] max-w-[calc(100vw-1rem)] gap-4 overflow-y-auto"
      >
        <PopoverHeader>
          <PopoverTitle>{LIVE_VOTE_LABEL.title}</PopoverTitle>
          <PopoverDescription>{LIVE_VOTE_LABEL.description}</PopoverDescription>
        </PopoverHeader>
        <VoteBody
          isLoading={isLoading}
          isError={isError}
          activePoll={activePoll}
          onVote={onVote}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
