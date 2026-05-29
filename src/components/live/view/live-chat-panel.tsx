"use client";
// 채팅 패널 컨테이너 — 메시지 목록, 입력창, 참여 조건 안내, 클린봇 상태를 조합합니다.

import { useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveDonationBanner } from "@/components/live/view/live-donation-banner";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { filterChatMessages } from "@/utils/live/live-chat";
import { LIVE_LABEL } from "@/constants/live/live";
import type {
  LiveChatMessage,
  LiveChatUnavailableReason,
  LiveDonation,
  LivePoll,
  LiveViewerChatState,
} from "@/types/live/live";

interface Props {
  creatorId: string;
  messages: LiveChatMessage[];
  donations: LiveDonation[];
  polls: LivePoll[];
  chatState: LiveViewerChatState;
  isLoggedIn: boolean;
  walletBalance: number;
  isWalletLoading?: boolean;
  isWalletError?: boolean;
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
}

function ParticipationNotice({
  chatUnavailableReason,
}: {
  chatUnavailableReason: LiveChatUnavailableReason | null;
}) {
  if (
    chatUnavailableReason !== "follower_required" &&
    chatUnavailableReason !== "follower_wait_required"
  ) {
    return null;
  }

  const isWaiting = chatUnavailableReason === "follower_wait_required";

  return (
    <div className="border-border bg-card border-t px-3 py-3">
      <div className="border-live/20 bg-live/5 flex items-start gap-2 rounded-lg border px-3 py-2.5">
        <UserRoundPlus className="text-live mt-0.5 size-4 shrink-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-foreground text-xs font-semibold">
            {isWaiting ? LIVE_LABEL.participationWaitTitle : LIVE_LABEL.participationFollowerTitle}
          </p>
          <p className="text-muted-foreground text-xs leading-snug">
            {isWaiting ? LIVE_LABEL.participationWaitDesc : LIVE_LABEL.participationFollowerDesc}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LiveChatPanel({
  creatorId,
  messages,
  donations,
  polls,
  chatState,
  isLoggedIn,
  walletBalance,
  isWalletLoading,
  isWalletError,
  onLoginPrompt,
  onSendMessage,
  onVote,
  onDonate,
  chatRuleText,
  onAcceptChatRule,
}: Props) {
  const [cleanbot, setCleanbot] = useState(true);
  const displayMessages = cleanbot ? messages : filterChatMessages(messages);

  return (
    <div className="border-border bg-card flex h-full min-h-96 flex-col overflow-hidden rounded-xl border md:min-h-0">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <span className="text-foreground text-sm font-semibold">{LIVE_LABEL.chat}</span>
        <LiveChatMenu
          creatorId={creatorId}
          chatRuleText={chatRuleText}
          cleanbot={cleanbot}
          onCleanbot={() => setCleanbot((prev) => !prev)}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-2 pt-2">
          <LiveDonationBanner donations={donations} />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <LiveChatMessageList messages={displayMessages} />
        </ScrollArea>
      </div>

      <ParticipationNotice chatUnavailableReason={chatState.chatUnavailableReason} />
      <LiveChatInputBar
        polls={polls}
        chatState={chatState}
        isLoggedIn={isLoggedIn}
        walletBalance={walletBalance}
        isWalletLoading={isWalletLoading}
        isWalletError={isWalletError}
        onLoginPrompt={onLoginPrompt}
        onSendMessage={onSendMessage}
        onVote={onVote}
        onDonate={onDonate}
        chatRuleText={chatRuleText}
        onAcceptChatRule={onAcceptChatRule}
      />
    </div>
  );
}
