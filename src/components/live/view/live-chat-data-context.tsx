"use client";
// 라이브 시청 채팅 데이터 컨텍스트 — live-view가 useLiveBroadcastView에서 받은 채팅 관련 값/콜백을
// LiveChatPanel(우측 패널)·LiveFullscreenChatOverlay(전체화면) 두 갈래로 동일하게 prop-drill하던 것을
// 한 번 provide해 대체한다. 컨텍스트는 이 두 컴포넌트만 소비하며, 그 아래(LiveChatBody 등)로는
// 기존처럼 props로 내려보낸다(범위: live-view→Panel/Overlay 한 단계).

import { createContext, useContext, type ReactNode } from "react";

import type {
  LiveChatMessage,
  LiveChatProfileContext,
  LiveDonation,
  LiveInteractionNotice,
  LivePoll,
  LiveViewerChatState,
} from "@/types/live/live";

interface LiveChatDataContextValue {
  messages: LiveChatMessage[];
  subscriptionBadgeCustomMonths?: number[];
  subscriptionBadgeVersion?: string | null;
  subscriptionBadgeImageSources?: Record<number, string>;
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
  // 후원금 충전(TossPayments) — 로그인 유저 id와 결제 후 복귀 경로.
  customerKey?: string;
  chargeReturnTo?: string;
  donationEnabled: boolean;
  donationMinAmount: number;
  onLoginPrompt: () => void;
  onSendMessage: (content: string) => Promise<boolean>;
  onVote?: (pollId: string, optionId: string) => Promise<boolean>;
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
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

const LiveChatDataContext = createContext<LiveChatDataContextValue | null>(null);

export function LiveChatDataProvider({
  value,
  children,
}: {
  value: LiveChatDataContextValue;
  children: ReactNode;
}) {
  return <LiveChatDataContext.Provider value={value}>{children}</LiveChatDataContext.Provider>;
}

export function useLiveChatData(): LiveChatDataContextValue {
  const context = useContext(LiveChatDataContext);
  if (context === null) {
    throw new Error("useLiveChatData must be used within a LiveChatDataProvider");
  }
  return context;
}

export type { LiveChatDataContextValue };
