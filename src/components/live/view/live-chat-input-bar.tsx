"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ChatEmojiPicker from "@/components/common/chat-emoji-picker";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { LiveDonationDialog } from "@/components/live/view/live-donation-dialog";
import { LiveVotePopover } from "@/components/live/view/live-vote-popover";
import { LIVE_CHAT_MESSAGE_MAX_LENGTH, LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type { LiveInteractionNotice, LivePoll, LiveViewerChatState } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
  interactionNotices?: LiveInteractionNotice[];
  isPollsLoading?: boolean;
  isPollsError?: boolean;
  isInteractionNoticesLoading?: boolean;
  isInteractionNoticesError?: boolean;
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
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
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
  // 미팔로우 안내 popover의 팔로우 액션. 미제공 시(예: 팝아웃) 팔로우 popover를 띄우지 않는다.
  onFollow?: () => void;
  isFollowing?: boolean;
  isFollowPending?: boolean;
}

function getChatPlaceholder({
  chatState,
  isLoggedIn,
}: {
  chatState: LiveViewerChatState;
  isLoggedIn: boolean;
}): string {
  if (!isLoggedIn) return LIVE_LABEL.chatLoginPlaceholder;
  if (chatState.canChat) return LIVE_LABEL.chatPlaceholder;

  switch (chatState.chatUnavailableReason) {
    case "chat_paused":
      return LIVE_LABEL.chatPausedPlaceholder;
    // 규칙 미동의는 일반 채팅 placeholder를 유지하고, 클릭하면 동의 popover로 안내한다.
    case "chat_rule_acceptance_required":
      return LIVE_LABEL.chatPlaceholder;
    case "follower_required":
      return LIVE_LABEL.chatFollowerPlaceholder;
    case "follower_wait_required":
    case "slow_mode_required":
      return LIVE_LABEL.chatWaitPlaceholder;
    case "manager_only":
      return LIVE_LABEL.chatManagerOnlyPlaceholder;
    default:
      return LIVE_LABEL.chatLoginPlaceholder;
  }
}

function clampChatDraft(value: string): string {
  return value.slice(0, LIVE_CHAT_MESSAGE_MAX_LENGTH);
}

export function LiveChatInputBar({
  polls,
  interactionNotices = [],
  isPollsLoading,
  isPollsError,
  isInteractionNoticesLoading,
  isInteractionNoticesError,
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
  onJoinDraw,
  onDonate,
  chatRuleText,
  showActions = true,
  votePresentation = "popover",
  className,
  onAcceptChatRule,
  onFollow,
  isFollowing,
  isFollowPending,
}: Props) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [isAcceptingRule, setIsAcceptingRule] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 타이핑은 채팅 가능 상태에서만 허용한다.
  const isEditable = isLoggedIn && chatState.canChat;
  const reason = chatState.chatUnavailableReason;
  // 미팔로우: 팔로우할 때까지 항상 떠 있는 안내 popover(팔로우 액션이 있을 때만).
  // 팔로우 직후 optimistic isFollowing으로 즉시 닫아, refetch 지연 중 재클릭→언팔로우를 막는다.
  const isFollowGate = isLoggedIn && reason === "follower_required" && !isFollowing && !!onFollow;
  // 클릭은 받되 타이핑은 막고 안내를 띄우는 게이트: 비로그인(로그인 유도), 규칙 미동의(규칙 popover).
  const isLoginGate = !isLoggedIn;
  const isRuleGate = isLoggedIn && reason === "chat_rule_acceptance_required";
  const isClickGate = isLoginGate || isRuleGate;
  // 그 외 사유(팔로우 필요·대기·슬로우모드·매니저 전용)는 입력칸 자체를 비활성화한다.
  const isInputDisabled = isSending || (!isEditable && !isClickGate);

  const placeholder = getChatPlaceholder({ chatState, isLoggedIn });
  const draftValue = isEditable ? draft : "";

  function setDraftValue(nextValue: string) {
    setDraft(clampChatDraft(nextValue));
  }

  function handleInputClick() {
    if (isLoginGate) {
      onLoginPrompt();
      return;
    }
    if (isRuleGate) setIsRuleOpen(true);
  }

  async function handleSend() {
    const trimmed = draftValue.trim();
    if (!trimmed || isSending || !isEditable) return;
    if (trimmed.length > LIVE_CHAT_MESSAGE_MAX_LENGTH) {
      setDraftValue(trimmed);
      return;
    }

    setIsSending(true);
    setDraftValue("");
    try {
      const isSuccess = await onSendMessage(trimmed);
      if (!isSuccess) setDraftValue(trimmed);
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
          onEmojiSelect={(emoji) => setDraftValue(draftValue + emoji)}
          disabled={!isEditable}
        />
        <Input
          ref={inputRef}
          value={draftValue}
          maxLength={LIVE_CHAT_MESSAGE_MAX_LENGTH}
          placeholder={placeholder}
          readOnly={!isEditable}
          disabled={isInputDisabled}
          onClick={handleInputClick}
          onChange={(e) => setDraftValue(e.target.value)}
          onKeyDown={(e) => {
            // 게이트 상태(로그인/규칙)에선 Enter를 클릭과 동일하게 다뤄, 키보드 사용자도
            // 마우스 클릭과 똑같이 안내 popover를 열 수 있게 한다(입력수단 동등성).
            if (!isEditable) {
              if (e.key === "Enter" && isClickGate) {
                e.preventDefault();
                handleInputClick();
              }
              return;
            }
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void handleSend();
            }
          }}
          aria-label={placeholder}
          className="read-only:bg-muted/70 h-8 flex-1 text-sm read-only:cursor-pointer"
        />
      </div>

      {/*
        미팔로우: 팔로우할 때까지 입력칸에 항상 떠 있는 팔로우 유도 popover.
        onOpenChange를 no-op으로 둬 Esc·바깥클릭으로는 닫히지 않게 한다(팔로우해야 해제).
        대신 modal={false}로 포커스 트랩 없이 띄워, 키보드·스크린리더 사용자가 갇히지 않게 한다.
      */}
      <Popover open={isFollowGate} onOpenChange={() => {}} modal={false}>
        <PopoverContent anchor={() => inputRef.current} align="start" side="top" className="w-80">
          <PopoverHeader>
            <PopoverTitle>{LIVE_LABEL.participationFollowerTitle}</PopoverTitle>
            <PopoverDescription>{LIVE_LABEL.participationFollowerDesc}</PopoverDescription>
          </PopoverHeader>
          <Button
            type="button"
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
            disabled={isFollowPending}
            onClick={onFollow}
          >
            {LIVE_LABEL.follow}
          </Button>
        </PopoverContent>
      </Popover>

      {/* 규칙 미동의: 입력칸을 클릭하면 동의 popover. 동의 전엔 타이핑 불가. */}
      <Popover
        open={isRuleOpen && isRuleGate}
        onOpenChange={(next) => setIsRuleOpen(isRuleGate && next)}
      >
        <PopoverContent
          anchor={() => inputRef.current}
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
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
            disabled={isAcceptingRule || !onAcceptChatRule}
            onClick={() => void handleAcceptRule()}
          >
            {LIVE_LABEL.chatRuleAccept}
          </Button>
        </PopoverContent>
      </Popover>

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
            interactionNotices={interactionNotices}
            isLoading={isPollsLoading}
            isError={isPollsError}
            isInteractionNoticesLoading={isInteractionNoticesLoading}
            isInteractionNoticesError={isInteractionNoticesError}
            isLoggedIn={isLoggedIn}
            onLoginPrompt={onLoginPrompt}
            onVote={onVote}
            onJoinDraw={onJoinDraw}
            presentation={votePresentation}
          />
        </div>
      ) : null}
    </div>
  );
}
