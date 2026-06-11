"use client";

import { useRef, useState } from "react";
import { SendHorizontal, Timer } from "lucide-react";
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
import {
  LiveDonationPopover,
  type LiveDonationCloseReason,
} from "@/components/live/view/live-donation-popover";
import { LiveVotePopover } from "@/components/live/view/live-vote-popover";
import { LIVE_CHAT_MESSAGE_MAX_LENGTH, LIVE_LABEL } from "@/constants/live/live";
import {
  formatFollowWaitTime,
  useFollowWaitCountdown,
} from "@/hooks/live/use-follow-wait-countdown";
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
  // 팔로우 대기 카운트다운 종료 시 viewer chat state를 다시 받아 입력 잠금을 푼다.
  onRefreshChatState?: () => void;
  // 전체화면 오버레이 등에서 사용할 때 popover/dialog 포털 컨테이너를 전체화면 요소로 지정한다(미지정=body).
  portalContainer?: HTMLElement | null;
  // 전체화면 후원 버튼이 후원 popover 열기를 요청한다(LiveDonationPopover로 그대로 전달).
  donationOpenRequested?: boolean;
  onDonationOpenSettled?: (reason: LiveDonationCloseReason) => void;
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
  onRefreshChatState,
  portalContainer,
  donationOpenRequested,
  onDonationOpenSettled,
}: Props) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [isAcceptingRule, setIsAcceptingRule] = useState(false);
  // 입력바 컨테이너(좌우 px-3 패딩 포함) 전체를 popover anchor로 삼아, 팝오버 폭(--anchor-width)을
  // 채팅 패널 테두리 안쪽 폭에 꽉 맞춘다(입력칸·버튼행보다 좌우 패딩만큼 더 넓게 테두리까지).
  const inputBarRef = useRef<HTMLDivElement>(null);

  // 채팅은 채널 단위(#111) — 방송 여부와 무관하게 채팅 가능 상태에서만 타이핑을 허용한다.
  const isEditable = isLoggedIn && chatState.canChat;
  const reason = chatState.chatUnavailableReason;
  // 미팔로우: 팔로우할 때까지 항상 떠 있는 안내 popover(팔로우 액션이 있을 때만).
  // 팔로우 직후 optimistic isFollowing으로 즉시 닫아, refetch 지연 중 재클릭→언팔로우를 막는다.
  const isFollowGate = isLoggedIn && reason === "follower_required" && !isFollowing && !!onFollow;
  // 팔로우 직후 대기: 같은 popover를 재사용해 내용만 카운트다운으로 바꿔 띄운다.
  const isFollowWaitGate = isLoggedIn && reason === "follower_wait_required";
  const waitSecondsLeft = useFollowWaitCountdown(
    isFollowWaitGate,
    chatState.remainingFollowWaitSeconds,
    onRefreshChatState,
  );
  // 클릭은 받되 타이핑은 막고 안내를 띄우는 게이트: 비로그인(로그인 유도), 규칙 미동의(규칙 popover).
  const isLoginGate = !isLoggedIn;
  const isRuleGate = isLoggedIn && reason === "chat_rule_acceptance_required";
  const isClickGate = isLoginGate || isRuleGate;
  // 그 외 사유(팔로우 필요·대기·슬로우모드·매니저 전용)는 입력칸 자체를 비활성화한다.
  // 전송 중(isSending)에는 비활성화하지 않는다 — disabled 전환은 input을 blur시켜
  // "한 번 보내면 포커스가 풀린다"는 문제를 만든다. 중복 전송은 handleSend 내부 가드가 막는다.
  const isInputDisabled = !isEditable && !isClickGate;

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
      // 실패 시 원문을 복원하되, 전송 중에 사용자가 이미 새 메시지를 입력했다면 덮어쓰지 않는다
      // (입력칸이 전송 중에도 활성이라 연속 입력이 가능해졌기 때문).
      if (!isSuccess) setDraft((current) => (current ? current : clampChatDraft(trimmed)));
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
    <div
      ref={inputBarRef}
      // 입력 섹션 높이를 좌측 비디오 하단 정보 영역(실측 149px)에 고정해 separator 라인을 맞춘다.
      // 버튼(h-9)은 입력칸(h-11)보다 낮게 두고, 둘 사이 간격은 justify-between이 자동으로 벌린다.
      className={cn(
        "border-border flex h-[149px] flex-col justify-between border-t px-3 py-6",
        className,
      )}
    >
      {/* 이모지 버튼을 입력 필드 안(오른쪽 trailing)에 넣어, 입력 필드 좌측이 아래 버튼행과 정렬되게 한다. */}
      <div className="relative">
        <Input
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
          className={cn(
            "read-only:bg-muted/70 h-11 w-full pr-17 text-sm read-only:cursor-pointer",
            // 기본 ring(무채색) 대신 브랜드 민트 포커스로 시청 화면의 입력임을 또렷하게 한다.
            "focus-visible:border-brand focus-visible:ring-brand/30",
          )}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          <ChatEmojiPicker
            onEmojiSelect={(emoji) => setDraftValue(draftValue + emoji)}
            disabled={!isEditable}
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={LIVE_LABEL.chatSend}
            className="text-brand hover:text-brand size-7"
            disabled={!isEditable || !draftValue.trim() || isSending}
            onClick={() => void handleSend()}
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/*
        미팔로우·팔로우 직후 대기: 해제될 때까지 입력칸에 항상 떠 있는 안내 popover(같은 popover를
        재사용하고 내용만 상태에 따라 바꾼다 — 미팔로우는 팔로우 버튼, 대기는 남은 시간 카운트다운).
        onOpenChange를 no-op으로 둬 Esc·바깥클릭으로는 닫히지 않게 한다(조건 해제로만 닫힘).
        대신 modal={false}로 포커스 트랩 없이 띄워, 키보드·스크린리더 사용자가 갇히지 않게 한다.
      */}
      <Popover open={isFollowGate || isFollowWaitGate} onOpenChange={() => {}} modal={false}>
        <PopoverContent
          anchor={() => inputBarRef.current}
          container={portalContainer}
          align="start"
          side="top"
          sideOffset={0}
          collisionPadding={0}
          className="w-(--anchor-width) rounded-b-none"
        >
          <PopoverHeader>
            <PopoverTitle>
              {isFollowWaitGate
                ? LIVE_LABEL.participationWaitTitle
                : LIVE_LABEL.participationFollowerTitle}
            </PopoverTitle>
            <PopoverDescription>
              {isFollowWaitGate
                ? LIVE_LABEL.participationWaitDesc
                : LIVE_LABEL.participationFollowerDesc}
            </PopoverDescription>
          </PopoverHeader>
          {isFollowWaitGate ? (
            <div
              className="bg-muted/60 text-foreground flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold tabular-nums"
              aria-live="polite"
            >
              <Timer className="text-brand size-4" />
              {formatFollowWaitTime(waitSecondsLeft)}
            </div>
          ) : (
            <Button
              type="button"
              className="bg-brand hover:bg-brand/90 text-brand-foreground"
              disabled={isFollowPending}
              onClick={onFollow}
            >
              {LIVE_LABEL.follow}
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* 규칙 미동의: 입력칸을 클릭하면 동의 popover. 동의 전엔 타이핑 불가. */}
      <Popover
        open={isRuleOpen && isRuleGate}
        onOpenChange={(next) => setIsRuleOpen(isRuleGate && next)}
      >
        <PopoverContent
          anchor={() => inputBarRef.current}
          container={portalContainer}
          align="start"
          side="top"
          sideOffset={0}
          collisionPadding={0}
          className="max-h-[calc(100vh-1rem)] w-(--anchor-width) overflow-y-auto rounded-b-none"
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
          <LiveDonationPopover
            isLoggedIn={isLoggedIn}
            walletBalance={walletBalance}
            isWalletLoading={isWalletLoading}
            isWalletError={isWalletError}
            donationEnabled={donationEnabled}
            donationMinAmount={donationMinAmount}
            onLoginPrompt={onLoginPrompt}
            onDonate={onDonate}
            portalContainer={portalContainer}
            anchorRef={inputBarRef}
            openRequested={donationOpenRequested}
            onOpenRequestSettled={onDonationOpenSettled}
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
            anchorRef={inputBarRef}
            portalContainer={portalContainer}
          />
        </div>
      ) : null}
    </div>
  );
}
