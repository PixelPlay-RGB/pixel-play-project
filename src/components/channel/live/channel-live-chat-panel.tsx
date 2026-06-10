"use client";
// 방송 운영 화면에서 실제 라이브 시청 채팅과 같은 외형의 채팅 패널을 렌더링합니다.

import type { ChannelLiveChatMessage } from "@/actions/channel/live";
import { LiveChatParticipationNotice } from "@/components/live/chat/live-chat-participation-notice";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { LiveDonationBanner } from "@/components/live/view/live-donation-banner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LIVE_DONATION_MIN_AMOUNT, LIVE_LABEL } from "@/constants/live/live";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useLiveDonationRanking } from "@/hooks/live/use-live-donation-ranking";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import type { LiveChatMessage, LiveViewerChatState } from "@/types/live/live";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  broadcastId?: string | null;
  creatorId?: string;
  chatRuleText?: string;
  onMessagesChange?: (messages: ChannelLiveChatMessage[]) => void;
}

function getStudioChatState(broadcastId: string | null | undefined): LiveViewerChatState {
  if (!broadcastId) {
    return {
      canChat: false,
      chatUnavailableReason: "live_offline",
      remainingFollowWaitSeconds: 0,
      remainingSlowModeSeconds: 0,
    };
  }

  return {
    canChat: true,
    chatUnavailableReason: null,
    remainingFollowWaitSeconds: 0,
    remainingSlowModeSeconds: 0,
  };
}

function toChannelLiveChatMessages(messages: LiveChatMessage[]): ChannelLiveChatMessage[] {
  return messages.flatMap((message) => {
    if (message.type !== "text" || !message.createdAt) {
      return [];
    }

    return [
      {
        authorName: message.author ?? LIVE_LABEL.anonymousAuthor,
        content: message.content,
        createdAt: message.createdAt,
        id: message.id,
        isCreator: Boolean(message.isHost),
      },
    ];
  });
}

export default function ChannelLiveChatPanel({
  broadcastId,
  creatorId,
  chatRuleText,
  onMessagesChange,
}: Props) {
  const [cleanbot, setCleanbot] = useState(true);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const popoutWindowRef = useRef<Window | null>(null);
  const popoutCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatState = useMemo(() => getStudioChatState(broadcastId), [broadcastId]);
  const { messages } = useLiveMessages(broadcastId, creatorId, creatorId);
  const { donations } = useLiveDonationRanking(creatorId ?? "");
  const { isLoggedIn, sendMessage } = useLiveChatSession({
    broadcastId,
    creatorId: creatorId ?? "",
    viewerChatState: chatState,
  });
  const channelLiveChatMessages = useMemo(() => toChannelLiveChatMessages(messages), [messages]);

  function handlePopoutOpen(win: Window) {
    popoutWindowRef.current = win;
    setIsPopoutOpen(true);
  }

  useEffect(() => {
    onMessagesChange?.(channelLiveChatMessages);
  }, [channelLiveChatMessages, onMessagesChange]);

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
    <div className="border-border bg-card flex h-full min-h-96 flex-col overflow-hidden rounded-xl border md:min-h-0">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <span className="text-foreground text-sm font-semibold">{LIVE_LABEL.chat}</span>
        {creatorId ? (
          <LiveChatMenu
            creatorId={creatorId}
            chatRuleText={chatRuleText}
            // 운영(스튜디오) 화면은 크리에이터 본인이라 규칙 동의 상태 칩을 표시하지 않는다.
            isRuleAccepted={false}
            isRulePending={false}
            cleanbot={cleanbot}
            onCleanbot={() => setCleanbot((prev) => !prev)}
            onPopoutOpen={handlePopoutOpen}
          />
        ) : null}
      </div>

      {isPopoutOpen ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <ExternalLink className="text-muted-foreground size-5" />
          <p className="text-muted-foreground text-sm">{LIVE_LABEL.chatPopoutActive}</p>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-2 pt-2">
              <LiveDonationBanner donations={donations} />
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <LiveChatMessageList messages={messages} cleanbotEnabled={cleanbot} />
            </ScrollArea>
          </div>
          <LiveChatParticipationNotice chatUnavailableReason={chatState.chatUnavailableReason} />

          <LiveChatInputBar
            polls={[]}
            chatState={chatState}
            isLoggedIn={isLoggedIn}
            walletBalance={0}
            donationEnabled={false}
            donationMinAmount={LIVE_DONATION_MIN_AMOUNT}
            showActions={false}
            chatRuleText={chatRuleText}
            onLoginPrompt={() => {}}
            onSendMessage={sendMessage}
          />
        </>
      )}
    </div>
  );
}
