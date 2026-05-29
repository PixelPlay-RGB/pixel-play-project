"use client";
// 투표 참여 Sheet — 채팅 패널 폭으로 하단에서 올라오는 슬라이드 컴포넌트입니다.

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  async function handleVote() {
    if (!selectedOption || isVoting) return;
    setIsVoting(true);
    const success = await onVote(activePoll.id, selectedOption);
    setIsVoting(false);
    if (success) onClose();
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-foreground text-sm">{activePoll.title}</p>
      <ul className="flex flex-col gap-2">
        {activePoll.options.map((option) => (
          <li key={option.id}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                "h-auto w-full justify-start px-3 py-2 text-left text-sm",
                selectedOption === option.id
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-foreground hover:border-brand/40",
              )}
            >
              {option.label}
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {activePoll.totalCount.toLocaleString()}
          {LIVE_VOTE_LABEL.totalCount}
        </span>
        <Button
          size="sm"
          disabled={!selectedOption || isVoting}
          onClick={() => void handleVote()}
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
        >
          {LIVE_VOTE_LABEL.submit}
        </Button>
      </div>
    </div>
  );
}

export function LiveVotePopover({ polls, isLoading, isError, onLoginPrompt, isLoggedIn, onVote }: Props) {
  const [open, setOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const activePoll = polls.find((p) => p.status === "active") ?? null;

  function handleOpen() {
    if (!isLoggedIn) {
      onLoginPrompt();
      return;
    }
    setOpenCount((c) => c + 1);
    setOpen(true);
  }

  return (
    <>
      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleOpen}>
        {LIVE_LABEL.vote}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 p-0 md:left-auto md:right-0 md:w-88 md:rounded-tl-xl"
        >
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <SheetTitle className="text-sm font-semibold">{LIVE_VOTE_LABEL.title}</SheetTitle>
            <SheetDescription className="sr-only">{LIVE_VOTE_LABEL.description}</SheetDescription>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setOpen(false)}
              aria-label={LIVE_LABEL.close}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground p-4 text-xs">{LIVE_VOTE_LABEL.loading}</p>
          ) : isError ? (
            <p className="text-muted-foreground p-4 text-xs">{LIVE_VOTE_LABEL.error}</p>
          ) : !activePoll ? (
            <p className="text-muted-foreground p-4 text-xs">{LIVE_VOTE_LABEL.empty}</p>
          ) : (
            <VoteContent
              key={`${activePoll.id}-${openCount}`}
              activePoll={activePoll}
              onVote={onVote}
              onClose={() => setOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
