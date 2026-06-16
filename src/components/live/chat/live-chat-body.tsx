"use client";
// 채팅 본문 공통 조립 — 후원 배너 + 메시지 목록(스크롤) + 참여 안내 + 입력바.
// 시청 패널(LiveChatPanel)·팝아웃(LiveChatPopout)·전체화면 오버레이(LiveFullscreenChatOverlay)가
// 머리말/컨테이너만 각자 두고 본문은 이 컴포넌트를 재사용한다(복붙 금지·추출).

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveDonationBanner } from "@/components/live/view/live-donation-banner";
import { LIVE_LABEL } from "@/constants/live/live";
import type {
  LiveChatMessage,
  LiveDonation,
  LiveInteractionNotice,
  LivePoll,
  LiveViewerChatState,
} from "@/types/live/live";

const DONATION_BANNER_TOP_INSET_PX = 88;
// 바닥에서 이만큼 멀어지면 "최근 채팅으로" 버튼을 띄운다 — 목록의 바닥 고정 해제 기준(60px)보다
// 넉넉하게 둬서, 바닥 근처 미세 스크롤에 버튼이 깜빡이지 않게 한다.
const SCROLL_TO_LATEST_VISIBLE_THRESHOLD_PX = 150;

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
  // 후원금 충전(TossPayments) — 로그인 유저 id와 결제 후 복귀 경로.
  customerKey?: string;
  chargeReturnTo?: string;
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
  // 클린봇(비속어 필터) 적용 여부. 패널에서만 토글하며 미지정 시 비적용.
  cleanbotEnabled?: boolean;
  // 과거 채팅 적재(무한 스크롤) — 목록 상단 도달 시 호출. 미지정 시 적재를 시도하지 않는다.
  onLoadOlderMessages?: () => void;
  isLoadingOlderMessages?: boolean;
  hasMoreChatHistory?: boolean;
  // 진입 시점 필터링 안내 위치 기준(마지막 메시지 id) — 메시지 목록으로 그대로 전달한다.
  entryNoticeAnchorId?: string | null;
  // 팔로우 대기 카운트다운 종료 등 게이트가 풀릴 시점에 viewer chat state를 다시 받는다.
  onRefreshChatState?: () => void;
  // 팔로워 전용 대기 시간·슬로우 모드 간격(설정값, 초)과 규칙 popover 열기 요청 — 입력바로 전달한다.
  followerWaitSeconds?: number;
  slowModeSeconds?: number;
  ruleOpenRequestId?: number;
  // 입력 섹션 동기화 높이(px) — 시청 화면에서 separator를 비디오 하단 라인과 일직선으로 만든다.
  inputMinHeightPx?: number | null;
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
  cleanbotEnabled,
  onLoadOlderMessages,
  isLoadingOlderMessages,
  hasMoreChatHistory,
  entryNoticeAnchorId,
  onRefreshChatState,
  followerWaitSeconds,
  slowModeSeconds,
  ruleOpenRequestId,
  inputMinHeightPx,
  showActions = true,
  votePresentation = "popover",
  portalContainer,
  inputClassName,
  donationOpenRequested,
  onDonationOpenSettled,
}: Props) {
  // 가상화 목록의 스크롤 컨테이너(ScrollArea viewport) ref — 목록 컴포넌트와 공유한다.
  const chatScrollRef = useRef<HTMLDivElement>(null);
  // 위로 스크롤해 바닥에서 멀어졌는지 — "최근 채팅으로" 버튼 노출 조건(같은 값이면 리렌더 없음).
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setIsAwayFromBottom(distanceFromBottom > SCROLL_TO_LATEST_VISIBLE_THRESHOLD_PX);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 즉시 점프(smooth 미사용) — 가상화 행 실측으로 높이가 변해도 목록의 바닥 고정이
  // 곧바로 다시 걸리도록 한 프레임에 바닥까지 내린다(점프 후 scroll 이벤트로 고정 복귀).
  const scrollToLatest = () => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* 배너는 메시지 영역 위에 absolute로 띄우고, 목록 inset은 고정값으로 둬 접힘 애니메이션이 채팅을 흔들지 않게 한다. */}
        <div className="absolute inset-x-0 top-0 z-10">
          <LiveDonationBanner donations={donations} />
        </div>
        {/* 과거 적재 중 표시 — 목록 행이 아니라 떠 있는 pill이라 안내 행(맨 위 고정)을 가리지 않는다. */}
        {isLoadingOlderMessages ? (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
            style={{ top: DONATION_BANNER_TOP_INSET_PX + 8 }}
          >
            <span className="bg-background/95 border-border text-muted-foreground flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm">
              <Spinner className="size-3.5" />
              {LIVE_LABEL.chatLoadingOlder}
            </span>
          </div>
        ) : null}
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
            topInsetPx={DONATION_BANNER_TOP_INSET_PX}
            scrollRef={chatScrollRef}
            onLoadOlderMessages={onLoadOlderMessages}
            isLoadingOlderMessages={isLoadingOlderMessages}
            hasMoreChatHistory={hasMoreChatHistory}
            entryNoticeAnchorId={entryNoticeAnchorId}
          />
        </ScrollArea>
        {/* 과거 채팅을 보다가 한 번에 바닥(최신)으로 복귀하는 플로팅 버튼 — 입력바 바로 위에 뜬다. */}
        {isAwayFromBottom ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
            <button
              type="button"
              onClick={scrollToLatest}
              className="bg-background/95 border-border text-foreground hover:bg-accent pointer-events-auto flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-md transition-colors"
            >
              <ChevronDown className="size-3.5" />
              {LIVE_LABEL.chatScrollToLatest}
            </button>
          </div>
        ) : null}
      </div>
      <LiveChatInputBar
        className={inputClassName}
        minHeightPx={inputMinHeightPx}
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
        showActions={showActions}
        votePresentation={votePresentation}
        portalContainer={portalContainer}
        donationOpenRequested={donationOpenRequested}
        onDonationOpenSettled={onDonationOpenSettled}
        chatRuleText={chatRuleText}
        onAcceptChatRule={onAcceptChatRule}
        onRefreshChatState={onRefreshChatState}
        followerWaitSeconds={followerWaitSeconds}
        slowModeSeconds={slowModeSeconds}
        ruleOpenRequestId={ruleOpenRequestId}
        onFollow={onFollow}
        isFollowing={isFollowing}
        isFollowPending={isFollowPending}
      />
    </>
  );
}
