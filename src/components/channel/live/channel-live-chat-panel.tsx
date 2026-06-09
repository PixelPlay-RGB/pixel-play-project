"use client";
// 방송 운영 화면에서 실제 라이브 시청 채팅과 같은 메시지 흐름을 렌더링합니다.

import type { ChannelLiveChatMessage } from "@/actions/channel/live";
import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LIVE_DONATION_MIN_AMOUNT, LIVE_LABEL } from "@/constants/live/live";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import { cn } from "@/lib/utils";
import type { LiveChatMessage, LiveViewerChatState } from "@/types/live/live";
import { MessageCircle, Pause, Play } from "lucide-react";
import { useEffect, useMemo } from "react";

interface Props {
  broadcastId?: string | null;
  creatorId?: string;
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
  liveState,
  onMessagesChange,
  onToggleChatPaused,
}: Props) {
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

  useEffect(() => {
    onMessagesChange?.(channelLiveChatMessages);
  }, [channelLiveChatMessages, onMessagesChange]);

  return (
    <Card className="flex min-h-144 flex-1 flex-col xl:h-full xl:min-h-0">
      <CardHeader className="has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1">
          <CardTitle>방송 채팅</CardTitle>
          <span className="text-muted-foreground text-xs">
            {liveState.isBroadcasting ? "실시간 방송 채팅" : "방송 시작 후 채팅 대기"}
          </span>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onToggleChatPaused}>
          {liveState.isChatPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          {liveState.isChatPaused ? "재개" : "일시정지"}
        </Button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold",
            liveState.isChatPaused ? "bg-warning/10 text-warning" : "bg-brand/10 text-brand",
          )}
        >
          {liveState.isChatPaused
            ? "채팅이 일시정지되었습니다."
            : "시청 화면과 같은 라이브 채팅을 표시합니다."}
        </div>

        <div className="border-border flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border">
          {!broadcastId && (
            <div className="text-muted-foreground flex min-h-full flex-col items-center justify-center gap-3 p-3 text-center text-sm">
              <MessageCircle className="size-8" />
              <div className="flex flex-col gap-1">
                <span>아직 연결된 방송 채팅이 없습니다.</span>
                <span>방송 시작 후 시청자가 채팅에 참여할 수 있습니다.</span>
              </div>
            </div>
          )}

          {broadcastId && messages.length === 0 && (
            <div className="text-muted-foreground flex min-h-full flex-col items-center justify-center gap-3 p-3 text-center text-sm">
              <MessageCircle className="size-8" />
              <span>아직 표시할 채팅이 없습니다.</span>
            </div>
          )}

          {broadcastId && messages.length > 0 && (
            <LiveChatMessageList messages={messages} fillHeight />
          )}
        </div>

        <LiveChatInputBar
          polls={[]}
          chatState={chatState}
          isLoggedIn={isLoggedIn}
          walletBalance={0}
          donationEnabled={false}
          donationMinAmount={LIVE_DONATION_MIN_AMOUNT}
          showActions={false}
          className="rounded-lg border"
          onLoginPrompt={() => {}}
          onSendMessage={sendMessage}
        />
      </CardContent>
    </Card>
  );
}
