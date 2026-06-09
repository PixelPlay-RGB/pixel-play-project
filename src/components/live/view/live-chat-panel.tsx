"use client";
// 채팅 패널 컨테이너 — 메시지 목록, 입력창, 참여 조건 안내, 클린봇 상태를 조합합니다.

import { useEffect, useRef, useState, type Ref } from "react";
import { ExternalLink, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveChatParticipationNotice } from "@/components/live/chat/live-chat-participation-notice";
import { LiveDonationBanner } from "@/components/live/view/live-donation-banner";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { LIVE_LABEL } from "@/constants/live/live";
import type {
  LiveChatMessage,
  LiveDonation,
  LivePoll,
  LiveViewerChatState,
} from "@/types/live/live";

interface Props {
  creatorId: string;
  messages: LiveChatMessage[];
  donations: LiveDonation[];
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
  onAcceptChatRule?: () => Promise<boolean>;
  onFollow?: () => void;
  isFollowing?: boolean;
  isFollowPending?: boolean;
  onCollapse?: () => void;
  collapseButtonRef?: Ref<HTMLButtonElement>;
}

export function LiveChatPanel({
  creatorId,
  messages,
  donations,
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
  onAcceptChatRule,
  onFollow,
  isFollowing,
  isFollowPending,
  onCollapse,
  collapseButtonRef,
}: Props) {
  const [cleanbot, setCleanbot] = useState(true);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  // 동의 여부 전용 필드가 없어 채팅 상태로 파생한다. 채팅 가능=동의 완료로 본다.
  const isRuleAccepted = isLoggedIn && chatState.canChat;
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

      {isPopoutOpen ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <ExternalLink className="text-muted-foreground size-5" />
          <p className="text-muted-foreground text-sm">{LIVE_LABEL.chatPopoutActive}</p>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-2 pt-2">
              <LiveDonationBanner donations={donations} />
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <LiveChatMessageList messages={messages} cleanbotEnabled={cleanbot} />
            </ScrollArea>
          </div>
          <LiveChatParticipationNotice chatUnavailableReason={chatState.chatUnavailableReason} />
          <LiveChatInputBar
            polls={polls}
            isPollsLoading={isPollsLoading}
            isPollsError={isPollsError}
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
            onDonate={onDonate}
            chatRuleText={chatRuleText}
            onAcceptChatRule={onAcceptChatRule}
            onFollow={onFollow}
            isFollowing={isFollowing}
            isFollowPending={isFollowPending}
          />
        </>
      )}
    </div>
  );
}
