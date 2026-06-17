"use client";
// 방송 운영 화면에서 실제 라이브 시청 채팅과 같은 외형의 채팅 패널을 렌더링합니다.

import { getLiveSubscriptionBadgeAssetsAction } from "@/actions/live/live";
import { ChannelStickerProvider } from "@/components/live/chat/channel-sticker-context";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { LIVE_DONATION_MIN_AMOUNT, LIVE_LABEL } from "@/constants/live/live";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useLiveDonationRanking } from "@/hooks/live/use-live-donation-ranking";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import { useAuthStore } from "@/stores/auth";
import type { LiveChatProfileContext, LiveViewerChatState } from "@/types/live/live";
import type { LiveSubscriptionBadgeAssetInfo } from "@/utils/live/live-subscription-badge";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  creatorId?: string;
  chatRuleText?: string;
}

// 운영(스튜디오) 화면은 크리에이터 본인 — 시청 화면과 동일하게 입력을 막지 않는다.
// 채팅은 채널 단위(#111)라 방송 시작 전에도 실제로 전송·표시된다.
const STUDIO_CHAT_STATE: LiveViewerChatState = {
  canChat: true,
  chatUnavailableReason: null,
  remainingFollowWaitSeconds: 0,
  remainingSlowModeSeconds: 0,
};

export default function ChannelLiveChatPanel({ creatorId, chatRuleText }: Props) {
  const [cleanbot, setCleanbot] = useState(true);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  // 메뉴의 "채팅 규칙" 클릭마다 증가 — 입력바 위 규칙 popover를 여는 요청 id.
  const [ruleOpenRequestId, setRuleOpenRequestId] = useState(0);
  const popoutWindowRef = useRef<Window | null>(null);
  const popoutCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatState = STUDIO_CHAT_STATE;
  const viewerId = useAuthStore((state) => state.user?.id) ?? null;
  const { messages, loadOlderMessages, isLoadingOlder, hasMoreHistory, entryNoticeAnchorId } =
    useLiveMessages(creatorId);
  const { donations } = useLiveDonationRanking(creatorId ?? "");
  // 구독 N개월 티콘(LiveSubscriptionBadge) 렌더용 에셋 — 채널 단위로 1회 조회(무한 캐싱).
  const { data: subscriptionBadgeAssets } = useQuery<LiveSubscriptionBadgeAssetInfo | null>({
    queryKey: QUERY_KEYS.live.subscriptionBadgeAssets(creatorId),
    enabled: Boolean(creatorId),
    staleTime: Infinity,
    queryFn: async () => {
      if (!creatorId) return null;

      const result = await getLiveSubscriptionBadgeAssetsAction(creatorId);

      return result.success ? (result.data ?? null) : null;
    },
  });
  const { isLoggedIn, sendMessage } = useLiveChatSession({
    creatorId: creatorId ?? "",
    viewerChatState: chatState,
  });

  // 닉네임 클릭 팝업(프로필/강퇴) — 운영 콘솔은 크리에이터 본인 화면이라 본인이면 강퇴 권한자다.
  // 채널 단위 강퇴라 broadcastId는 없다(채널 전체 차단). 시청·팝아웃 표면과 동일하게 동작하게 한다.
  const profileContext = useMemo<LiveChatProfileContext | undefined>(
    () =>
      creatorId
        ? { creatorId, viewerId, canModerate: viewerId === creatorId, broadcastId: null }
        : undefined,
    [creatorId, viewerId],
  );

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
    <ChannelStickerProvider creatorId={creatorId}>
      {/* 시청 화면 채팅 패널과 같은 풀블리드 — 칼럼 구분은 부모(border-x)가 담당한다. */}
      <div className="bg-card flex h-full min-h-96 flex-col overflow-hidden md:min-h-0">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <span className="text-foreground text-sm font-semibold">{LIVE_LABEL.chat}</span>
          {creatorId ? (
            <LiveChatMenu
              creatorId={creatorId}
              cleanbot={cleanbot}
              onCleanbot={() => setCleanbot((prev) => !prev)}
              onPopoutOpen={handlePopoutOpen}
              onShowRules={() => setRuleOpenRequestId((id) => id + 1)}
            />
          ) : null}
        </div>

        {isPopoutOpen ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <ExternalLink className="text-muted-foreground size-5" />
            <p className="text-muted-foreground text-sm">{LIVE_LABEL.chatPopoutActive}</p>
          </div>
        ) : (
          // 시청 화면과 같은 채팅 본문(배너 오버레이+동적 inset+바닥 정렬)을 그대로 재사용해
          // 두 화면의 채팅 동작이 항상 함께 움직이게 한다. 운영 화면은 후원·투표 액션만 끈다.
          <LiveChatBody
            creatorId={creatorId ?? ""}
            messages={messages}
            subscriptionBadgeCustomMonths={subscriptionBadgeAssets?.customMonths}
            subscriptionBadgeVersion={subscriptionBadgeAssets?.version}
            donations={donations}
            polls={[]}
            chatState={chatState}
            isLoggedIn={isLoggedIn}
            walletBalance={0}
            donationEnabled={false}
            donationMinAmount={LIVE_DONATION_MIN_AMOUNT}
            showActions={false}
            chatRuleText={chatRuleText}
            cleanbotEnabled={cleanbot}
            onLoginPrompt={() => {}}
            onSendMessage={sendMessage}
            onLoadOlderMessages={loadOlderMessages}
            isLoadingOlderMessages={isLoadingOlder}
            hasMoreChatHistory={hasMoreHistory}
            entryNoticeAnchorId={entryNoticeAnchorId}
            ruleOpenRequestId={ruleOpenRequestId}
            profileContext={profileContext}
          />
        )}
      </div>
    </ChannelStickerProvider>
  );
}
