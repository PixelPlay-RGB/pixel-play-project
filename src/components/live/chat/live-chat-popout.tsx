"use client";
// 별도 탭으로 열리는 채팅 전용 팝아웃 화면입니다.

import { useMemo } from "react";

import { Radio } from "lucide-react";
import { ChannelStickerProvider } from "@/components/live/chat/channel-sticker-context";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import { LIVE_LABEL } from "@/constants/live/live";
import { useLiveBroadcastView } from "@/hooks/live/use-live-broadcast-view";
import { useLiveFollowAction } from "@/hooks/live/use-live-follow-action";
import { useMoveToLogin } from "@/hooks/live/use-move-to-login";

interface Props {
  creatorId: string;
}

export function LiveChatPopout({ creatorId }: Props) {
  const moveToLogin = useMoveToLogin();

  const {
    chatRuleText,
    isLoading,
    broadcast,
    creator,
    messages,
    subscriptionBadgeCustomMonths,
    subscriptionBadgeVersion,
    subscriptionBadgeImageSources,
    loadOlderMessages,
    isLoadingOlderMessages,
    hasMoreChatHistory,
    entryNoticeAnchorId,
    donations,
    polls,
    isPollsLoading,
    isPollsError,
    isLoggedIn,
    isAuthLoading,
    walletBalance,
    isWalletLoading,
    isWalletError,
    viewerId,
    donationEnabled,
    donationMinAmount,
    chatState,
    sendMessage,
    acceptChatRule,
    votePoll,
    sendDonation,
    isFollowing,
    onFollowToggled,
    isSubscribed,
    refreshChatState,
    followerWaitSeconds,
    slowModeSeconds,
    canModerate,
    isBanned,
  } = useLiveBroadcastView(creatorId);

  // 닉네임 클릭 팝업 컨텍스트 — 팝아웃도 메인과 동일하게 강퇴/프로필을 지원한다(#119).
  const profileContext = useMemo(
    () => ({ creatorId, viewerId, canModerate, broadcastId: broadcast?.id ?? null }),
    [creatorId, viewerId, canModerate, broadcast?.id],
  );

  const { handleFollow, isFollowPending } = useLiveFollowAction({
    creatorId,
    isFollowing,
    isLoggedIn,
    onFollowToggled,
    onUnauthenticated: moveToLogin,
  });

  if (isAuthLoading || isLoading) {
    return (
      <div className="live-overlay-root live-popout-root bg-background flex h-dvh min-h-0 w-full items-center justify-center overflow-hidden">
        <div className="border-brand/30 border-t-brand h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  // 채널 자체가 없을 때만 안내로 끝낸다 — 채팅은 채널 단위(#111)라 방송 외에도 열린다.
  if (!broadcast && !creator) {
    return (
      <div className="live-overlay-root live-popout-root bg-background flex h-dvh min-h-0 w-full items-center justify-center overflow-hidden">
        <p className="text-muted-foreground text-sm">{LIVE_LABEL.broadcastOffline}</p>
      </div>
    );
  }

  // 강퇴(밴)되면 팝아웃도 채팅을 렌더하지 않고 안내로 막는다(메인 차단 화면과 동일 가드, 해제 시 자동 복귀).
  if (isBanned) {
    return (
      <div className="live-overlay-root live-popout-root bg-background flex h-dvh min-h-0 w-full flex-col items-center justify-center gap-2 overflow-hidden px-4 text-center">
        <p className="text-foreground text-sm font-bold">
          {LIVE_LABEL.bannedEvictedTitle(creator?.name)}
        </p>
        <p className="text-muted-foreground text-sm">{LIVE_LABEL.bannedEvictedDescription}</p>
      </div>
    );
  }

  return (
    <ChannelStickerProvider creatorId={creatorId} canUseChannelStickers={isSubscribed}>
      <div className="live-overlay-root live-popout-root bg-background flex h-dvh min-h-0 w-full flex-col overflow-hidden">
        <div className="border-border flex h-11 shrink-0 items-center gap-2 border-b px-3">
          {broadcast ? (
            <span className="bg-live text-live-foreground flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-bold">
              <Radio className="size-2.5" />
              {LIVE_LABEL.live}
            </span>
          ) : null}
          <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
            {broadcast?.title ?? creator?.name}
          </span>
        </div>

        <LiveChatBody
          creatorId={creatorId}
          messages={messages}
          subscriptionBadgeCustomMonths={subscriptionBadgeCustomMonths}
          subscriptionBadgeVersion={subscriptionBadgeVersion}
          subscriptionBadgeImageSources={subscriptionBadgeImageSources}
          donations={donations}
          polls={polls}
          isPollsLoading={isPollsLoading}
          isPollsError={isPollsError}
          chatState={chatState}
          isLoggedIn={isLoggedIn}
          walletBalance={walletBalance}
          isWalletLoading={isWalletLoading}
          isWalletError={isWalletError}
          customerKey={viewerId ?? undefined}
          chargeReturnTo={`/live/${creatorId}`}
          donationEnabled={donationEnabled}
          donationMinAmount={donationMinAmount}
          onLoginPrompt={moveToLogin}
          onSendMessage={sendMessage}
          onVote={votePoll}
          onDonate={sendDonation}
          votePresentation="dialog"
          chatRuleText={chatRuleText}
          onAcceptChatRule={acceptChatRule}
          onFollow={handleFollow}
          isFollowing={isFollowing}
          isFollowPending={isFollowPending}
          inputClassName="shrink-0"
          onLoadOlderMessages={loadOlderMessages}
          isLoadingOlderMessages={isLoadingOlderMessages}
          hasMoreChatHistory={hasMoreChatHistory}
          entryNoticeAnchorId={entryNoticeAnchorId}
          onRefreshChatState={refreshChatState}
          followerWaitSeconds={followerWaitSeconds}
          slowModeSeconds={slowModeSeconds}
          profileContext={profileContext}
        />
      </div>
    </ChannelStickerProvider>
  );
}
