"use client";
// 채팅 패널 컨테이너 — 메시지 목록, 입력창, 참여 조건 안내, 클린봇 상태를 조합합니다.

import { useEffect, useRef, useState, type Ref } from "react";
import { ExternalLink, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { LIVE_LABEL } from "@/constants/live/live";
import type {
  LiveChatMessage,
  LiveChatProfileContext,
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
  onAcceptChatRule?: () => Promise<boolean>;
  onFollow?: () => void;
  isFollowing?: boolean;
  isFollowPending?: boolean;
  onCollapse?: () => void;
  collapseButtonRef?: Ref<HTMLButtonElement>;
  // 과거 채팅 적재(무한 스크롤)·진입 안내 위치·게이트 설정값 — LiveChatBody로 그대로 전달한다.
  onLoadOlderMessages?: () => void;
  isLoadingOlderMessages?: boolean;
  hasMoreChatHistory?: boolean;
  entryNoticeAnchorId?: string | null;
  onRefreshChatState?: () => void;
  followerWaitSeconds?: number;
  slowModeSeconds?: number;
  // 닉네임 클릭 팝업(프로필/강퇴) 컨텍스트 — 채팅 본문으로 그대로 전달한다(#119).
  profileContext?: LiveChatProfileContext;
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
  onAcceptChatRule,
  onFollow,
  isFollowing,
  isFollowPending,
  onCollapse,
  collapseButtonRef,
  onLoadOlderMessages,
  isLoadingOlderMessages,
  hasMoreChatHistory,
  entryNoticeAnchorId,
  onRefreshChatState,
  followerWaitSeconds,
  slowModeSeconds,
  profileContext,
}: Props) {
  const [cleanbot, setCleanbot] = useState(true);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  // 메뉴의 "채팅 규칙" 클릭마다 증가 — 입력바 위 규칙 popover를 여는 요청 id.
  const [ruleOpenRequestId, setRuleOpenRequestId] = useState(0);
  const popoutWindowRef = useRef<Window | null>(null);
  const popoutCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    <div className="border-border bg-card flex h-full min-h-96 flex-col overflow-hidden border-t md:min-h-0 md:border-t-0 md:border-l">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
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
            cleanbot={cleanbot}
            onCleanbot={() => setCleanbot((prev) => !prev)}
            onPopoutOpen={handlePopoutOpen}
            onShowRules={() => setRuleOpenRequestId((id) => id + 1)}
          />
        </div>
      </div>

      {isPopoutOpen ? (
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
          cleanbotEnabled={cleanbot}
          onLoadOlderMessages={onLoadOlderMessages}
          isLoadingOlderMessages={isLoadingOlderMessages}
          hasMoreChatHistory={hasMoreChatHistory}
          entryNoticeAnchorId={entryNoticeAnchorId}
          onRefreshChatState={onRefreshChatState}
          followerWaitSeconds={followerWaitSeconds}
          slowModeSeconds={slowModeSeconds}
          ruleOpenRequestId={ruleOpenRequestId}
          profileContext={profileContext}
        />
      )}
    </div>
  );
}
