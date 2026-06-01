"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ChatEmojiPicker from "@/components/chat-room/chat-emoji-picker";
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
import { LIVE_CHAT_MESSAGE_MAX_LENGTH, LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type { LivePoll, LiveViewerChatState } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
  isPollsLoading?: boolean;
  isPollsError?: boolean;
  chatState: LiveViewerChatState;
  isLoggedIn: boolean;
  walletBalance: number;
  isWalletLoading?: boolean;
  isWalletError?: boolean;
  donationEnabled: boolean;
  donationMinAmount: number;
  onLoginPrompt: () => void;
  onSendMessage: (content: string) => Promise<boolean>;
  onVote?: (pollId: string, optionId: string) => Promise<boolean>;
  onDonate?: (params: {
    amount: number;
    message: string;
    isAnonymous: boolean;
    idempotencyKey: string;
  }) => Promise<boolean>;
  chatRuleText?: string;
  showActions?: boolean;
  votePresentation?: "popover" | "dialog";
  className?: string;
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

function clampChatDraft(value: string): string {
  return value.slice(0, LIVE_CHAT_MESSAGE_MAX_LENGTH);
}

export function LiveChatInputBar({
  polls,
  isPollsLoading,
  isPollsError,
  chatState,
  isLoggedIn,
  walletBalance,
  isWalletLoading,
  isWalletError,
  donationEnabled,
  donationMinAmount,
  onLoginPrompt,
  onSendMessage,
  onVote,
  onDonate,
  chatRuleText,
  showActions = true,
  votePresentation = "popover",
  className,
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
    if (trimmed.length > LIVE_CHAT_MESSAGE_MAX_LENGTH) {
      setDraft(clampChatDraft(trimmed));
      return;
    }

    setIsSending(true);
    setDraft("");
    try {
      const isSuccess = await onSendMessage(trimmed);
      if (!isSuccess) setDraft(clampChatDraft(trimmed));
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
    <div className={cn("border-border flex flex-col gap-2 border-t px-3 py-3", className)}>
      <div className="flex items-center gap-2">
        <ChatEmojiPicker
          onEmojiSelect={(emoji) => setDraft((prev) => clampChatDraft(prev + emoji))}
          disabled={!isInputActive}
        />
        <Popover
          open={isRuleOpen}
          onOpenChange={(next) => setIsRuleOpen(shouldShowRule && next)}
        >
          <PopoverTrigger
            nativeButton={false}
            render={
              <Input
                value={isInputActive ? draft : ""}
                maxLength={LIVE_CHAT_MESSAGE_MAX_LENGTH}
                placeholder={placeholder}
                readOnly={!isInputActive}
                disabled={isSending}
                onClick={handleInputClick}
                onChange={(e) => setDraft(clampChatDraft(e.target.value))}
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
          {shouldShowRule ? (
            <PopoverContent
              align="start"
              side="top"
              className="max-h-[calc(100vh-1rem)] w-80 overflow-y-auto"
            >
              <PopoverHeader>
                <PopoverTitle>{LIVE_LABEL.chatRuleTitle}</PopoverTitle>
                <PopoverDescription>{LIVE_LABEL.chatRuleDescription}</PopoverDescription>
              </PopoverHeader>
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
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
          ) : null}
        </Popover>
      </div>

      {showActions && onVote && onDonate ? (
        <div className="flex items-center gap-2">
          <LiveDonationDialog
            isLoggedIn={isLoggedIn}
            walletBalance={walletBalance}
            isWalletLoading={isWalletLoading}
            isWalletError={isWalletError}
            donationEnabled={donationEnabled}
            donationMinAmount={donationMinAmount}
            onLoginPrompt={onLoginPrompt}
            onDonate={onDonate}
          />
          <LiveVotePopover
            polls={polls}
            isLoading={isPollsLoading}
            isError={isPollsError}
            isLoggedIn={isLoggedIn}
            onLoginPrompt={onLoginPrompt}
            onVote={onVote}
            presentation={votePresentation}
          />
        </div>
      ) : null}
    </div>
  );
}
