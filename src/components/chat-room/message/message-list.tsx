"use client";
// message-list 컴포넌트를 제공합니다.

import { ArrowDown } from "lucide-react";

import { MessageItem } from "@/components/chat-room/message/message-item";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessageListViewport } from "@/hooks/message/use-message-list-viewport";
import { cn } from "@/lib/utils";
import type { MessageQuery } from "@/types/message";
import { canGroupMessages } from "@/utils/message";

interface Props {
  messages: MessageQuery[];
  currentUserId: string;
  hasMorePrevious: boolean;
  isLoadingPrevious: boolean;
  onReachTop: () => boolean;
}

export function MessageList({
  messages,
  currentUserId,
  hasMorePrevious,
  isLoadingPrevious,
  onReachTop,
}: Props) {
  const { viewportRef, showLatestButton, handleScroll, scrollToLatest } = useMessageListViewport({
    messages,
    currentUserId,
    hasMorePrevious,
    isLoadingPrevious,
    onReachTop,
  });

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <ScrollArea ref={viewportRef} className="size-full" onScroll={handleScroll}>
        <div className="flex flex-col-reverse py-2">
          {messages.map((message, index) => {
            const previousOnScreen = messages[index + 1];
            const nextOnScreen = messages[index - 1];
            const isGroupedWithPrevious = canGroupMessages(message, previousOnScreen);
            const isGroupedWithNext = canGroupMessages(message, nextOnScreen);

            return (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={message.user_id === currentUserId}
                isGroupedWithPrevious={isGroupedWithPrevious}
                isGroupedWithNext={isGroupedWithNext}
                showAuthor={!isGroupedWithPrevious}
              />
            );
          })}
        </div>
      </ScrollArea>

      {showLatestButton ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={scrollToLatest}
            className={cn(
              "pointer-events-auto rounded-full border px-3 shadow-md backdrop-blur-sm",
              "border-brand/20 bg-background/95 text-brand hover:bg-brand/10 hover:text-brand",
            )}
          >
            <ArrowDown className="size-3.5" />
            최근 메시지
          </Button>
        </div>
      ) : null}

      {isLoadingPrevious ? (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
          <div
            className={cn(
              "rounded-md px-2 py-1 text-center text-xs shadow-sm backdrop-blur-sm",
              "bg-background/90 text-muted-foreground",
            )}
          >
            이전 메시지 불러오는 중...
          </div>
        </div>
      ) : null}
    </div>
  );
}
