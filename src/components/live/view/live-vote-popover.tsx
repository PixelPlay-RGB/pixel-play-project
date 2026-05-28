"use client";
// 투표 참여 mock Popover — 없음·진행·완료·종료 상태를 제공합니다.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LIVE_LABEL, LIVE_VOTE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type { LivePoll } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
  onLoginPrompt: () => void;
  isLoggedIn: boolean;
}

export function LiveVotePopover({ polls, onLoginPrompt, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const activePoll = polls.find((p) => p.status === "active") ?? null;

  function handleOpenChange(next: boolean) {
    if (next && !isLoggedIn) {
      onLoginPrompt();
      return;
    }
    setOpen(next);
  }

  function handleVote() {
    if (!selectedOption) return;
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={<Button size="sm" variant="outline" className="flex-1 text-xs" />}>
        {LIVE_LABEL.vote}
      </PopoverTrigger>
      <PopoverContent className="w-72" side="top" align="end">
        <p className="text-foreground mb-3 text-sm font-semibold">{LIVE_VOTE_LABEL.title}</p>

        {!activePoll ? (
          <p className="text-muted-foreground text-xs">{LIVE_VOTE_LABEL.empty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-foreground text-sm">{activePoll.title}</p>

            <ul className="flex flex-col gap-2">
              {activePoll.options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedOption(option.id)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selectedOption === option.id
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-foreground hover:border-brand/40",
                    )}
                  >
                    {option.label}
                  </button>
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
                disabled={!selectedOption}
                onClick={handleVote}
                className="bg-brand hover:bg-brand/90 text-brand-foreground"
              >
                {LIVE_VOTE_LABEL.submit}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
