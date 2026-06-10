"use client";
// 전체화면 시 비디오 우측에 뜨는 채팅 패널. 열기/닫기 토글은 플레이어 우상단 스택이 소유하고,
// 이 컴포넌트는 열린 패널(헤더 X로도 닫기 가능)만 렌더한다.
// LiveVideoPlayer의 전체화면 컨테이너 내부에 렌더되어, 채팅과 후원/투표 모달이 전체화면에서도 보인다.
// 채팅을 열면 비디오가 패널 폭(w-80)만큼 좌측으로 줄어들고(영상을 가리지 않음), 패널은 일반 시청 화면의
// 채팅(LiveChatBody, 후원·투표 액션 내장)과 동일하게 구성한다. 모달/popover는 container=전체화면 요소로 포털한다.

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import { LIVE_FULLSCREEN_CHAT_PANEL_WIDTH, LIVE_LABEL } from "@/constants/live/live";
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevChatOpenRef = useRef(isChatOpen);

  // 채팅을 열면 패널 닫기(X) 버튼으로 포커스를 옮긴다(닫는 방향의 포커스 복귀는
  // 토글 버튼을 소유한 LiveVideoPlayer가 담당). 초기 마운트(prev===현재)엔 가로채지 않는다.
  useEffect(() => {
    if (prevChatOpenRef.current === isChatOpen) return;
    prevChatOpenRef.current = isChatOpen;
    if (isChatOpen) closeButtonRef.current?.focus();
  }, [isChatOpen]);

  // 닫힘 상태에선 아무것도 렌더하지 않는다(여는 버튼은 플레이어 우상단 스택).
  if (!isChatOpen) {
    return null;
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
