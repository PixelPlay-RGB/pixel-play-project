"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LiveDonationDialog } from "@/components/live/view/live-donation-dialog";
import { LiveVotePopover } from "@/components/live/view/live-vote-popover";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LivePoll, LiveViewerChatState } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
  chatState: LiveViewerChatState;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  onSendMessage: (content: string) => Promise<boolean>;
  chatRuleText?: string;
  showActions?: boolean;
  onAcceptChatRule?: () => Promise<boolean>;
}

function getChatPlaceholder(chatState: LiveViewerChatState, isLoggedIn: boolean): string {
  if (!isLoggedIn) return LIVE_LABEL.chatLoginPlaceholder;
  if (chatState.canChat) return LIVE_LABEL.chatPlaceholder;

  switch (chatState.chatUnavailableReason) {
    case "follower_required":
    case "follower_wait_required":
      return LIVE_LABEL.chatFollowerPlaceholder;
    case "slow_mode_required":
      return LIVE_LABEL.chatWaitPlaceholder;
    case "manager_only":
      return LIVE_LABEL.chatManagerOnlyPlaceholder;
    case "chat_rule_acceptance_required":
      return LIVE_LABEL.chatRulePlaceholder;
    default:
      return LIVE_LABEL.chatLoginPlaceholder;
  }
}

export function LiveChatInputBar({
  polls,
  chatState,
  isLoggedIn,
  onLoginPrompt,
  onSendMessage,
  chatRuleText,
  showActions = true,
  onAcceptChatRule,
}: Props) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [isAcceptingRule, setIsAcceptingRule] = useState(false);

  const isInputActive = isLoggedIn && chatState.canChat;
  const shouldShowRule =
    isLoggedIn && chatState.chatUnavailableReason === "chat_rule_acceptance_required";
  const placeholder = getChatPlaceholder(chatState, isLoggedIn);

  function handleInputClick() {
    if (!isLoggedIn) {
      onLoginPrompt();
      return;
    }

    if (shouldShowRule) {
      setIsRuleOpen(true);
    }
  }

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || isSending || !isInputActive) return;

    setIsSending(true);
    setDraft("");
    try {
      const isSuccess = await onSendMessage(trimmed);
      if (!isSuccess) setDraft(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  async function handleAcceptRule() {
    if (!onAcceptChatRule || isAcceptingRule) return;

    setIsAcceptingRule(true);
    try {
      const isSuccess = await onAcceptChatRule();
      if (isSuccess) setIsRuleOpen(false);
    } finally {
      setIsAcceptingRule(false);
    }
  }

  return (
    <div className="border-border flex flex-col gap-2 border-t px-3 py-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          aria-label="이모티콘"
          className="size-8 shrink-0 p-0"
          onClick={() => {
            // TODO: 이모티콘 피커 구현
          }}
        >
          <Smile className="text-muted-foreground size-5" />
        </Button>
        <Popover open={isRuleOpen} onOpenChange={setIsRuleOpen}>
          <PopoverTrigger
            render={
              <Input
                value={isInputActive ? draft : ""}
                placeholder={placeholder}
                readOnly={!isInputActive}
                disabled={isSending}
                onClick={handleInputClick}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                aria-label={placeholder}
                className="read-only:bg-muted/70 h-8 flex-1 text-sm read-only:cursor-pointer"
              />
            }
          />
          <PopoverContent align="start" side="top" className="w-80">
            <PopoverHeader>
              <PopoverTitle>{LIVE_LABEL.chatRuleTitle}</PopoverTitle>
              <PopoverDescription>{LIVE_LABEL.chatRuleDescription}</PopoverDescription>
            </PopoverHeader>
            <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
              {chatRuleText || LIVE_LABEL.chatRuleDefaultText}
            </p>
            <Button
              type="button"
              className="bg-live hover:bg-live/90 text-white"
              disabled={isAcceptingRule || !onAcceptChatRule}
              onClick={() => void handleAcceptRule()}
            >
              {LIVE_LABEL.chatRuleAccept}
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {showActions ? (
        <div className="flex items-center gap-2">
          <LiveDonationDialog isLoggedIn={isLoggedIn} onLoginPrompt={onLoginPrompt} />
          <LiveVotePopover polls={polls} isLoggedIn={isLoggedIn} onLoginPrompt={onLoginPrompt} />
        </div>
      ) : null}
    </div>
  );
}
