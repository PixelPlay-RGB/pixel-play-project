"use client";

import { MessageItem } from "@/components/message/message-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MessageQuery } from "@/types/message";
import { useCallback, useLayoutEffect, useRef } from "react";

const TOP_PREFETCH_PX = 50;

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const prevNewestIdRef = useRef<string | null>(null);
  const prevOldestIdRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef(0);

  const scrollViewportToBottom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const newestId = messages[0]?.id ?? null;
    const oldestId = messages.at(-1)?.id ?? null;
    const prevNewest = prevNewestIdRef.current;
    const prevOldest = prevOldestIdRef.current;

    if (prevOldest === null) {
      scrollViewportToBottom();
    } else if (newestId !== prevNewest && oldestId === prevOldest) {
      scrollViewportToBottom();
    } else if (oldestId !== prevOldest && newestId === prevNewest) {
      const diff = viewport.scrollHeight - prevScrollHeightRef.current;
      if (diff !== 0) {
        viewport.scrollTop += diff;
      }
    }

    prevNewestIdRef.current = newestId;
    prevOldestIdRef.current = oldestId;
    prevScrollHeightRef.current = viewport.scrollHeight;
  }, [messages, scrollViewportToBottom]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const viewport = e.currentTarget;
      const isNearTop = viewport.scrollTop <= TOP_PREFETCH_PX;

      if (isNearTop && hasMorePrevious && !isLoadingPrevious) {
        onReachTop();
      }
    },
    [hasMorePrevious, isLoadingPrevious, onReachTop],
  );

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <ScrollArea ref={viewportRef} className="size-full" onScroll={handleScroll}>
        <div className="flex flex-col-reverse gap-3 py-2">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.user_id === currentUserId}
            />
          ))}
        </div>
      </ScrollArea>

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
