"use client";
// 채팅 패널 컨테이너 — 메시지 목록, 입력창, 참여 조건 안내, 클린봇 상태를 조합합니다.

import { useEffect, useRef, useState, type Ref } from "react";
import { ExternalLink, MessageSquareOff, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { LIVE_LABEL } from "@/constants/live/live";
import type {
  LiveChatMessage,
  LiveDonation,
  LiveInteractionNotice,
  LivePoll,
  LiveViewerChatState,
} from "@/types/live/live";

interface Props {
  creatorId: string;
  messages: LiveChatMessage[];
  donations: LiveDonation[];
  polls: LivePoll[];
  interactionNotices: LiveInteractionNotice[];
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
  // 채팅 규칙 동의 여부(훅이 RPC 신호로 판정). 메뉴 동의 칩 표시용.
  // required — optional+기본값이면 새 콜사이트가 배선을 빠뜨려도 조용히 '미동의'로 퇴화한다.
  isRuleAccepted: boolean;
  onAcceptChatRule?: () => Promise<boolean>;
  onFollow?: () => void;
  isFollowing?: boolean;
  isFollowPending?: boolean;
  onCollapse?: () => void;
  collapseButtonRef?: Ref<HTMLButtonElement>;
  // 방송 종료(broadcast=null): 입력만 비활성화하고 메시지 목록은 유지한다.
  isEnded?: boolean;
  // 재진입·새로고침으로 처음부터 종료 상태일 때만 채팅 본문 전체를 "이용 불가"로 덮는다
  // (시청 중 종료는 그동안 받은 메시지를 그대로 보여주므로 덮지 않는다).
  showEndedOverlay?: boolean;
}

export function LiveChatPanel({
  creatorId,
  messages,
  donations,
  polls,
  interactionNotices,
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
  isRuleAccepted,
  onAcceptChatRule,
  onFollow,
  isFollowing,
  isFollowPending,
  onCollapse,
  collapseButtonRef,
  isEnded = false,
  showEndedOverlay = false,
}: Props) {
  const [cleanbot, setCleanbot] = useState(true);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  // 동의 완료는 prop(RPC 전용 필드 기반)으로 받고, "동의 필요" 안내만 사유로 파생한다.
  const isRulePending =
    isLoggedIn && chatState.chatUnavailableReason === "chat_rule_acceptance_required";
  const popoutWindowRef = useRef<Window | null>(null);
  const popoutCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 채팅 규칙 popover를 패널 폭에 맞추기 위한 anchor(헤더 전체 폭). 입력바 popover와 동일 방식.
  const chatHeaderRef = useRef<HTMLDivElement>(null);

  function handlePopoutOpen(win: Window) {
    popoutWindowRef.current = win;
    setIsPopoutOpen(true);
  }

  useEffect(() => {
    if (!isPopoutOpen) return;

    popoutCheckIntervalRef.current = setInterval(() => {
      if (!popoutWindowRef.current || popoutWindowRef.current.closed) {
        popoutWindowRef.current = null;
        setIsPopoutOpen(false);
      }
    }, 1000);

    return () => {
      if (popoutCheckIntervalRef.current) {
        clearInterval(popoutCheckIntervalRef.current);
        popoutCheckIntervalRef.current = null;
      }
    };
  }, [isPopoutOpen]);

  return (
    <div className="border-border bg-card flex h-full min-h-96 flex-col overflow-hidden rounded-xl border md:min-h-0">
      <div
        ref={chatHeaderRef}
        className="border-border flex items-center justify-between border-b px-4 py-3"
      >
        <span className="text-foreground text-sm font-semibold">{LIVE_LABEL.chat}</span>
        <div className="flex items-center gap-1">
          {onCollapse ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    ref={collapseButtonRef}
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={LIVE_LABEL.chatCollapse}
                    className="hidden md:inline-flex"
                    onClick={onCollapse}
                  />
                }
              >
                <PanelRightClose className="size-4" />
              </TooltipTrigger>
              <TooltipContent>{LIVE_LABEL.chatCollapse}</TooltipContent>
            </Tooltip>
          ) : null}
          <LiveChatMenu
            creatorId={creatorId}
            chatRuleText={chatRuleText}
            isRuleAccepted={isRuleAccepted}
            isRulePending={isRulePending}
            cleanbot={cleanbot}
            onCleanbot={() => setCleanbot((prev) => !prev)}
            onPopoutOpen={handlePopoutOpen}
            anchorRef={chatHeaderRef}
          />
        </div>
      </div>

      {showEndedOverlay ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <MessageSquareOff className="text-muted-foreground size-5" />
          <p className="text-muted-foreground text-sm">{LIVE_LABEL.chatUnavailable}</p>
        </div>
      ) : isPopoutOpen ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <ExternalLink className="text-muted-foreground size-5" />
          <p className="text-muted-foreground text-sm">{LIVE_LABEL.chatPopoutActive}</p>
        </div>
      ) : (
        <LiveChatBody
          messages={messages}
          donations={donations}
          polls={polls}
          interactionNotices={interactionNotices}
          isPollsLoading={isPollsLoading}
          isPollsError={isPollsError}
          isInteractionNoticesLoading={isInteractionNoticesLoading}
          isInteractionNoticesError={isInteractionNoticesError}
          chatState={chatState}
          isLoggedIn={isLoggedIn}
          walletBalance={walletBalance}
          isWalletLoading={isWalletLoading}
          isWalletError={isWalletError}
          donationEnabled={donationEnabled}
          donationMinAmount={donationMinAmount}
          onLoginPrompt={onLoginPrompt}
          onSendMessage={onSendMessage}
          onVote={onVote}
          onJoinDraw={onJoinDraw}
          onDonate={onDonate}
          chatRuleText={chatRuleText}
          onAcceptChatRule={onAcceptChatRule}
          onFollow={onFollow}
          isFollowing={isFollowing}
          isFollowPending={isFollowPending}
          isEnded={isEnded}
          cleanbotEnabled={cleanbot}
        />
      )}
    </div>
  );
}
