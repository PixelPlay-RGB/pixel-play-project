"use client";
// 방송 운영 화면에서 실제 라이브 시청 채팅과 같은 외형의 채팅 패널을 렌더링합니다.

import type { ChannelLiveChatMessage } from "@/actions/channel/live";
import { LiveChatBody } from "@/components/live/chat/live-chat-body";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { LIVE_DONATION_MIN_AMOUNT, LIVE_LABEL } from "@/constants/live/live";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useLiveDonationRanking } from "@/hooks/live/use-live-donation-ranking";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import type { LiveChatMessage, LiveViewerChatState } from "@/types/live/live";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  creatorId?: string;
  chatRuleText?: string;
  onMessagesChange?: (messages: ChannelLiveChatMessage[]) => void;
}

// 운영(스튜디오) 화면은 크리에이터 본인 — 시청 화면과 동일하게 입력을 막지 않는다.
// 채팅은 채널 단위(#111)라 방송 시작 전에도 실제로 전송·표시된다.
const STUDIO_CHAT_STATE: LiveViewerChatState = {
  canChat: true,
  chatUnavailableReason: null,
  remainingFollowWaitSeconds: 0,
  remainingSlowModeSeconds: 0,
};

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

export default function ChannelLiveChatPanel({ creatorId, chatRuleText, onMessagesChange }: Props) {
  const [cleanbot, setCleanbot] = useState(true);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const popoutWindowRef = useRef<Window | null>(null);
  const popoutCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatState = STUDIO_CHAT_STATE;
  const { messages, loadOlderMessages, isLoadingOlder, hasMoreHistory, entryNoticeAnchorId } =
    useLiveMessages(creatorId, creatorId);
  const { donations } = useLiveDonationRanking(creatorId ?? "");
  const { isLoggedIn, sendMessage } = useLiveChatSession({
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
    // 시청 화면 채팅 패널과 같은 풀블리드 — 칼럼 구분은 부모(border-x)가 담당한다.
    <div className="bg-card flex h-full min-h-96 flex-col overflow-hidden md:min-h-0">
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
        // 시청 화면과 같은 채팅 본문(배너 오버레이+동적 inset+바닥 정렬)을 그대로 재사용해
        // 두 화면의 채팅 동작이 항상 함께 움직이게 한다. 운영 화면은 후원·투표 액션만 끈다.
        <LiveChatBody
          messages={messages}
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
        />
      )}
    </div>
  );
}
