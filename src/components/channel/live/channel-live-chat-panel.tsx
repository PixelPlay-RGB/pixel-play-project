"use client";
// 방송 운영의 실제 라이브 채팅과 채팅 일시정지 제어를 렌더링합니다.
import {
  sendChannelLiveChatMessageAction,
  type ChannelLiveChatMessage,
} from "@/actions/channel/live";
import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/constants/message/message";
import { useChannelLiveChatSubscription } from "@/hooks/channel/use-channel-live-chat-subscription";
import { cn } from "@/lib/utils";
import { messageContentSchema } from "@/lib/zod/message";
import { toastAppError } from "@/utils/common/toast-message";
import { MessageCircle, Pause, Play, SendHorizontal } from "lucide-react";
import { type FormEvent, useEffect, useState, useTransition } from "react";

interface Props {
  broadcastId?: string | null;
  initialMessages: ChannelLiveChatMessage[];
  liveState: ChannelLiveState;
  onMessagesChange?: (messages: ChannelLiveChatMessage[]) => void;
  onToggleChatPaused: () => void;
}

export default function ChannelLiveChatPanel({
  broadcastId,
  initialMessages,
  liveState,
  onMessagesChange,
  onToggleChatPaused,
}: Props) {
  const { appendMessage, messages } = useChannelLiveChatSubscription({
    broadcastId,
    initialMessages,
  });
  const [draft, setDraft] = useState("");
  const [isSendPending, startSendTransition] = useTransition();
  const isInputDisabled = !broadcastId || liveState.isChatPaused || isSendPending;

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!broadcastId || isInputDisabled) {
      return;
    }

    const parsed = messageContentSchema.safeParse(draft);

    if (!parsed.success) {
      toastAppError(APP_MESSAGE_CODE.error.message.invalidInput);
      return;
    }

    const content = parsed.data;
    setDraft("");

    startSendTransition(async () => {
      const result = await sendChannelLiveChatMessageAction({
        broadcastId,
        content,
      });

      if (!result.success || !result.data?.message) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.message.sendFailed);
        setDraft(content);
        return;
      }

      const sentMessage = result.data.message;
      appendMessage(sentMessage);
    });
  };

  return (
    <Card className="flex min-h-144 flex-1 flex-col xl:h-full xl:min-h-0">
      <CardHeader className="has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1">
          <CardTitle>방송 채팅</CardTitle>
          <span className="text-muted-foreground text-xs">
            {liveState.isBroadcasting ? "실시간 방송 채팅" : "방송 시작 전 채팅 대기"}
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
            : "채팅이 정상적으로 열려 있습니다."}
        </div>

        <div className="border-border flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-lg border p-3">
          {!broadcastId && (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm">
              <MessageCircle className="size-8" />
              <div className="flex flex-col gap-1">
                <span>아직 연결된 방송 채팅이 없습니다.</span>
                <span>방송 시작 후 시청자가 채팅에 참여할 수 있습니다.</span>
              </div>
            </div>
          )}

          {broadcastId && messages.length === 0 && (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm">
              <MessageCircle className="size-8" />
              <span>아직 표시할 채팅이 없습니다.</span>
            </div>
          )}

          {broadcastId &&
            messages.map((message) => (
              <div key={message.id} className="flex gap-2 text-sm">
                <strong className={cn("shrink-0", message.isCreator ? "text-brand" : "text-info")}>
                  {message.authorName}
                </strong>
                <span className="text-foreground min-w-0">{message.content}</span>
              </div>
            ))}
        </div>
        <form
          className="border-border bg-background flex shrink-0 items-center gap-2 rounded-lg border px-2 py-2"
          onSubmit={handleSubmit}
        >
          <input
            value={draft}
            disabled={isInputDisabled}
            maxLength={MESSAGE_CONTENT_MAX_LENGTH}
            placeholder={
              broadcastId
                ? liveState.isChatPaused
                  ? "채팅이 일시정지되었습니다."
                  : "채팅 입력"
                : "방송 시작 후 채팅 입력 가능"
            }
            className={cn(
              "min-h-10 flex-1 rounded-md bg-transparent px-2 text-sm outline-none",
              "placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-60",
            )}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-brand hover:bg-brand/90 shrink-0 rounded-lg text-white"
            disabled={isInputDisabled}
          >
            <SendHorizontal className="size-4" />
            <span className="sr-only">채팅 전송</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
