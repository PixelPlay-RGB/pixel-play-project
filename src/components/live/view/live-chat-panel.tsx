"use client";
// 채팅 패널 컨테이너 — 메시지 목록, 입력창, 참여 조건 안내, 클린봇 상태를 조합합니다.

import { useEffect, useRef, useState, type Ref } from "react";
import { ExternalLink, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { useLiveChatData } from "@/components/live/view/live-chat-data-context";
import { LIVE_LABEL } from "@/constants/live/live";

interface Props {
  creatorId: string;
  onCollapse?: () => void;
  collapseButtonRef?: Ref<HTMLButtonElement>;
}

export function LiveChatPanel({ creatorId, onCollapse, collapseButtonRef }: Props) {
  // 채팅 데이터/콜백은 live-view가 provide하는 컨텍스트에서 읽는다(이전엔 prop-drill).
  // 본문(LiveChatBody)으로의 전달 값/개수는 그대로 유지하고 소스만 props→context로 바꾼다.
  const {
    messages,
    subscriptionBadgeCustomMonths,
    subscriptionBadgeVersion,
    subscriptionBadgeImageSources,
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
    customerKey,
    chargeReturnTo,
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
    onLoadOlderMessages,
    isLoadingOlderMessages,
    hasMoreChatHistory,
    entryNoticeAnchorId,
    onRefreshChatState,
    followerWaitSeconds,
    slowModeSeconds,
    profileContext,
  } = useLiveChatData();
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
          creatorId={creatorId}
          messages={messages}
          subscriptionBadgeCustomMonths={subscriptionBadgeCustomMonths}
          subscriptionBadgeVersion={subscriptionBadgeVersion}
          subscriptionBadgeImageSources={subscriptionBadgeImageSources}
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
          customerKey={customerKey}
          chargeReturnTo={chargeReturnTo}
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
