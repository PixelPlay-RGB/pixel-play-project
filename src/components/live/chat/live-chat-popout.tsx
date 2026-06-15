"use client";
// 별도 탭으로 열리는 채팅 전용 팝아웃 화면입니다.

import { Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import { LIVE_LABEL } from "@/constants/live/live";
import { useLiveBroadcastView } from "@/hooks/live/use-live-broadcast-view";
import { useLiveFollowAction } from "@/hooks/live/use-live-follow-action";
import { useMoveToLogin } from "@/hooks/live/use-move-to-login";

interface Props {
  creatorId: string;
}

export function LiveChatPopout({ creatorId }: Props) {
  const router = useRouter();
  const moveToLogin = useMoveToLogin();

  const {
    chatRuleText,
    isLoading,
    broadcast,
    messages,
    subscriptionBadgeCustomMonths,
    donations,
    polls,
    isPollsLoading,
    isPollsError,
    isLoggedIn,
    isAuthLoading,
    walletBalance,
    isWalletLoading,
    isWalletError,
    donationEnabled,
    donationMinAmount,
    chatState,
    sendMessage,
    acceptChatRule,
    votePoll,
    sendDonation,
    isFollowing,
    onFollowToggled,
  } = useLiveBroadcastView(creatorId);

  const { handleFollow, isFollowPending } = useLiveFollowAction({
    creatorId,
    isFollowing,
    isLoggedIn,
    onFollowToggled,
    onUnauthenticated: moveToLogin,
  });

  function moveToLiveWatch() {
    router.push(`/live/${creatorId}`);
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="live-overlay-root live-popout-root bg-background flex h-dvh min-h-0 w-full items-center justify-center overflow-hidden">
        <div className="border-brand/30 border-t-brand h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="live-overlay-root live-popout-root bg-background flex h-dvh min-h-0 w-full items-center justify-center overflow-hidden">
        <p className="text-muted-foreground text-sm">{LIVE_LABEL.broadcastOffline}</p>
      </div>
    );
  }

  return (
    <div className="live-overlay-root live-popout-root bg-background flex h-dvh min-h-0 w-full flex-col overflow-hidden">
      <div className="border-border flex h-11 shrink-0 items-center gap-2 border-b px-3">
        <span className="bg-live text-live-foreground flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-bold">
          <Radio className="size-2.5" />
          {LIVE_LABEL.live}
        </span>
        <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
          {broadcast.title}
        </span>
      </div>

      <LiveChatBody
        creatorId={creatorId}
        messages={messages}
        subscriptionBadgeCustomMonths={subscriptionBadgeCustomMonths}
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
        noticeActionLabel={LIVE_LABEL.openLiveWatch}
        onNoticeAction={moveToLiveWatch}
        inputClassName="shrink-0"
      />
    </div>
  );
}
