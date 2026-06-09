"use client";
// 방송 운영 화면에서 실제 라이브 시청 채팅과 같은 외형의 채팅 패널을 렌더링합니다.

import type { ChannelLiveChatMessage } from "@/actions/channel/live";
import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { LiveChatParticipationNotice } from "@/components/live/chat/live-chat-participation-notice";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIVE_DONATION_MIN_AMOUNT, LIVE_LABEL } from "@/constants/live/live";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import type { LiveChatMessage, LiveViewerChatState } from "@/types/live/live";
import { ExternalLink, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  broadcastId?: string | null;
  creatorId?: string;
  chatRuleText?: string;
  liveState: ChannelLiveState;
  onMessagesChange?: (messages: ChannelLiveChatMessage[]) => void;
  onToggleChatPaused: () => void;
}

function getStudioChatState(
  broadcastId: string | null | undefined,
  isChatPaused: boolean,
): LiveViewerChatState {
  if (!broadcastId) {
    return {
      canChat: false,
      chatUnavailableReason: "live_offline",
      remainingFollowWaitSeconds: 0,
      remainingSlowModeSeconds: 0,
    };
  }

  if (isChatPaused) {
    return {
      canChat: false,
      chatUnavailableReason: "slow_mode_required",
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
  liveState,
  onMessagesChange,
  onToggleChatPaused,
}: Props) {
  const [cleanbot, setCleanbot] = useState(true);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const popoutWindowRef = useRef<Window | null>(null);
  const popoutCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatState = useMemo(
    () => getStudioChatState(broadcastId, liveState.isChatPaused),
    [broadcastId, liveState.isChatPaused],
  );
  const { messages } = useLiveMessages(broadcastId, creatorId, creatorId);
  const { isLoggedIn, sendMessage } = useLiveChatSession({
    broadcastId,
    creatorId: creatorId ?? "",
    viewerChatState: chatState,
  });
  const channelLiveChatMessages = useMemo(() => toChannelLiveChatMessages(messages), [messages]);
  const pauseLabel = liveState.isChatPaused ? "채팅 재개" : "채팅 일시정지";

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
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={pauseLabel}
                  onClick={onToggleChatPaused}
                />
              }
            >
              {liveState.isChatPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </TooltipTrigger>
            <TooltipContent>{pauseLabel}</TooltipContent>
          </Tooltip>
          {creatorId ? (
            <LiveChatMenu
              creatorId={creatorId}
              chatRuleText={chatRuleText}
              cleanbot={cleanbot}
              onCleanbot={() => setCleanbot((prev) => !prev)}
              onPopoutOpen={handlePopoutOpen}
            />
          ) : null}
        </div>
      </div>

      {isPopoutOpen ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <ExternalLink className="text-muted-foreground size-5" />
          <p className="text-muted-foreground text-sm">{LIVE_LABEL.chatPopoutActive}</p>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col">
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
