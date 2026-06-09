"use client";
// 전체화면 시 비디오 우측에 뜨는 채팅 패널과, 채팅이 닫혀 있을 때 이를 여는 버튼.
// LiveVideoPlayer의 전체화면 컨테이너 내부에 렌더되어, 채팅과 후원/투표 모달이 전체화면에서도 보인다.
// 채팅을 열면 비디오가 패널 폭(w-80)만큼 좌측으로 줄어들고(영상을 가리지 않음), 패널은 일반 시청 화면의
// 채팅(LiveChatBody, 후원·투표 액션 내장)과 동일하게 구성한다. 모달/popover는 container=전체화면 요소로 포털한다.

import { useEffect, useRef } from "react";
import { MessageSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import {
  LIVE_FULLSCREEN_CHAT_PANEL_WIDTH,
  LIVE_LABEL,
  LIVE_PLAYER_ICON_BUTTON_CLASS,
} from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type {
  LiveChatMessage,
  LiveDonation,
  LivePoll,
  LiveViewerChatState,
} from "@/types/live/live";

interface Props {
  // 전체화면 요소(모달·popover 포털 대상). 미장착 직후엔 null일 수 있다.
  container: HTMLElement | null;
  // 채팅 패널 열림 상태는 LiveVideoPlayer가 소유한다(비디오/컨트롤 폭 축소와 공유해야 하므로).
  isChatOpen: boolean;
  onToggleChat: () => void;
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
  onDonate: (params: {
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
  isEnded?: boolean;
}

export function LiveFullscreenChatOverlay({
  container,
  isChatOpen,
  onToggleChat,
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
  isEnded = false,
}: Props) {
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevChatOpenRef = useRef(isChatOpen);

  // 채팅 토글 시 새로 나타난 컨트롤로 포커스를 옮긴다(전체화면에서 사라진 버튼에 포커스가 갇히지 않게).
  // 닫으면 다시 열기 버튼으로, 열면 패널 닫기(X) 버튼으로. 초기 마운트(prev===현재)엔 포커스를 가로채지 않는다.
  useEffect(() => {
    if (prevChatOpenRef.current === isChatOpen) return;
    prevChatOpenRef.current = isChatOpen;
    if (isChatOpen) closeButtonRef.current?.focus();
    else openButtonRef.current?.focus();
  }, [isChatOpen]);

  // 채팅이 닫혀 있을 때만 여는 버튼을 띄운다. 열린 뒤엔 패널 헤더의 닫기(X)로 접는다.
  if (!isChatOpen) {
    return (
      <div className="pointer-events-none absolute inset-y-0 right-0 z-30 flex items-center">
        <div className="pointer-events-auto rounded-l-lg bg-black/45 p-1.5 backdrop-blur-sm">
          <Button
            ref={openButtonRef}
            type="button"
            size="icon"
            variant="ghost"
            aria-label={LIVE_LABEL.chatExpand}
            className={LIVE_PLAYER_ICON_BUTTON_CLASS}
            onClick={onToggleChat}
          >
            <MessageSquare className="size-5" />
          </Button>
        </div>
      </div>
    );
  }

  // 채팅 패널: 불투명 배경이라 뒤 비디오가 비치지 않고, 비디오는 별도로 좌측 축소된다.
  // 본문은 일반 시청 화면(LiveChatPanel)과 동일하게 후원·투표 액션을 내장한다(미니 strip로 분리하지 않음).
  return (
    <aside
      className={cn(
        "border-border bg-background pointer-events-auto absolute inset-y-0 right-0 z-20 flex max-w-full flex-col border-l",
        LIVE_FULLSCREEN_CHAT_PANEL_WIDTH,
      )}
    >
      <div className="border-border flex shrink-0 items-center justify-between border-b px-3 py-2">
        <span className="text-foreground text-sm font-semibold">{LIVE_LABEL.chat}</span>
        <Button
          ref={closeButtonRef}
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={LIVE_LABEL.chatCollapse}
          onClick={onToggleChat}
        >
          <X className="size-4" />
        </Button>
      </div>

      <LiveChatBody
        messages={messages}
        donations={donations}
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
        isEnded={isEnded}
        portalContainer={container}
      />
    </aside>
  );
}
