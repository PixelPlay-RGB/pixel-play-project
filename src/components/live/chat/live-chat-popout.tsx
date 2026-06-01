"use client";
// 별도 탭으로 열리는 채팅 전용 팝아웃 화면입니다.

import { Radio } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveChatParticipationNotice } from "@/components/live/chat/live-chat-participation-notice";
import { LiveDonationBanner } from "@/components/live/view/live-donation-banner";
import { LIVE_LABEL } from "@/constants/live/live";
import { useLiveBroadcastView } from "@/hooks/live/use-live-broadcast-view";
import { createPathWithNext } from "@/utils/common/redirect";

interface Props {
  creatorId: string;
}

export function LiveChatPopout({ creatorId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    chatRuleText,
    isLoading,
    broadcast,
    messages,
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
  } = useLiveBroadcastView(creatorId);

  function moveToLogin() {
    const query = searchParams.toString();
    const next = `${pathname}${query ? `?${query}` : ""}`;
    router.push(createPathWithNext("/auth/login", next));
  }

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
        <span className="bg-live flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-bold text-white">
          <Radio className="size-2.5" />
          {LIVE_LABEL.live}
        </span>
        <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
          {broadcast.title}
        </span>
      </div>

      <div className="w-full shrink-0 px-2 pt-2">
        <LiveDonationBanner donations={donations} />
      </div>

      <ScrollArea className="min-h-0 w-full flex-1">
        <LiveChatMessageList messages={messages} fillHeight />
      </ScrollArea>

      <LiveChatParticipationNotice
        chatUnavailableReason={chatState.chatUnavailableReason}
        actionLabel={LIVE_LABEL.openLiveWatch}
        onAction={moveToLiveWatch}
      />

      <LiveChatInputBar
        className="shrink-0"
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
      />
    </div>
  );
}
