"use client";
// 채팅 본문 공통 조립 — 후원 배너 + 메시지 목록(스크롤) + 참여 안내 + 입력바.
// 시청 패널(LiveChatPanel)·팝아웃(LiveChatPopout)·전체화면 오버레이(LiveFullscreenChatOverlay)가
// 머리말/컨테이너만 각자 두고 본문은 이 컴포넌트를 재사용한다(복붙 금지·추출).

import { useRef } from "react";

import { useMeasuredHeight } from "@/hooks/common/use-measured-height";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveChatParticipationNotice } from "@/components/live/chat/live-chat-participation-notice";
import { LiveDonationBanner } from "@/components/live/view/live-donation-banner";
import type {
  LiveChatMessage,
  LiveDonation,
  LiveInteractionNotice,
  LivePoll,
  LiveViewerChatState,
} from "@/types/live/live";

interface Props {
  messages: LiveChatMessage[];
  donations: LiveDonation[];
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
  onAcceptChatRule?: () => Promise<boolean>;
  onFollow?: () => void;
  isFollowing?: boolean;
  isFollowPending?: boolean;
  // 방송 종료: 입력만 비활성화하고 메시지 목록·참여 안내는 그대로 둔다.
  isEnded?: boolean;
  // 클린봇(비속어 필터) 적용 여부. 패널에서만 토글하며 미지정 시 비적용.
  cleanbotEnabled?: boolean;
  // 메시지가 적어도 목록이 스크롤 영역을 채우게 한다(팝아웃 등 본문이 메인인 화면).
  fillMessages?: boolean;
  // 참여 안내의 보조 액션(예: 팝아웃에서 "시청 화면 열기").
  noticeActionLabel?: string;
  onNoticeAction?: () => void;
  // 입력바 하단의 후원·투표 액션행 노출 여부(미지정=노출). 전체화면 포털이 필요하면 portalContainer를 함께 준다.
  showActions?: boolean;
  votePresentation?: "popover" | "dialog";
  // 전체화면 오버레이 등에서 popover/dialog를 띄울 포털 컨테이너(미지정=body).
  portalContainer?: HTMLElement | null;
  inputClassName?: string;
  // 전체화면 후원 버튼의 후원 popover 열기 요청(입력바로 그대로 전달).
  donationOpenRequested?: boolean;
  onDonationOpenSettled?: (reason: "donated" | "dismissed") => void;
}

export function LiveChatBody({
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
  isEnded = false,
  cleanbotEnabled,
  fillMessages,
  noticeActionLabel,
  onNoticeAction,
  showActions = true,
  votePresentation = "popover",
  portalContainer,
  inputClassName,
  donationOpenRequested,
  onDonationOpenSettled,
}: Props) {
  // 가상화 목록의 스크롤 컨테이너(ScrollArea viewport) ref — 목록 컴포넌트와 공유한다.
  const chatScrollRef = useRef<HTMLDivElement>(null);
  // 배너 실측 높이 — 접고 펼칠 때마다 목록 상단 inset 패딩이 따라가도록 측정해 넘긴다.
  const [bannerRef, bannerHeight] = useMeasuredHeight<HTMLDivElement>();

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* 배너는 메시지 영역 위에 absolute로 띄워, 접고 펼쳐도 채팅 목록이 밀리지 않는다. */}
        <div ref={bannerRef} className="absolute inset-x-0 top-0 z-10">
          <LiveDonationBanner donations={donations} />
        </div>
        {/* 채팅 목록: 스크롤바는 숨기고(몰입), overscroll-contain으로 바깥 스크롤 전파를 막는다. */}
        <ScrollArea
          ref={chatScrollRef}
          className="min-h-0 flex-1"
          hideScrollbar
          viewportClassName="overscroll-contain"
        >
          <LiveChatMessageList
            messages={messages}
            cleanbotEnabled={cleanbotEnabled}
            fillHeight={fillMessages}
            topInsetPx={bannerHeight}
            scrollRef={chatScrollRef}
          />
        </ScrollArea>
      </div>
      {!isEnded ? (
        <LiveChatParticipationNotice
          chatUnavailableReason={chatState.chatUnavailableReason}
          actionLabel={noticeActionLabel}
          onAction={onNoticeAction}
        />
      ) : null}
      <LiveChatInputBar
        className={inputClassName}
        isEnded={isEnded}
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
        showActions={showActions}
        votePresentation={votePresentation}
        portalContainer={portalContainer}
        donationOpenRequested={donationOpenRequested}
        onDonationOpenSettled={onDonationOpenSettled}
        chatRuleText={chatRuleText}
        onAcceptChatRule={onAcceptChatRule}
        onFollow={onFollow}
        isFollowing={isFollowing}
        isFollowPending={isFollowPending}
      />
    </>
  );
}
