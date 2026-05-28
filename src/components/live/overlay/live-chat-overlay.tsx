"use client";
// OBS 브라우저 소스에 붙이는 라이브 채팅 출력 화면을 렌더링합니다.
import { Crown } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE } from "@/constants/live/live-overlay";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { LiveMessageRow } from "@/types/live/live";
import type {
  LiveChatOverlayItem,
  LiveChatOverlayMessage,
  LiveChatOverlaySnapshot,
} from "@/types/live/live-chat-overlay";
import { mapLiveMessageToChatOverlayItem } from "@/utils/live/live-overlay-message";

export function LiveChatOverlay({ initialSnapshot }: { initialSnapshot: LiveChatOverlaySnapshot }) {
  const chatStackRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<LiveChatOverlayItem[]>(initialSnapshot.items);
  const broadcast = initialSnapshot.broadcast;

  const fitItemsToHeight = useCallback(() => {
    const chatStack = chatStackRef.current;

    if (!chatStack) {
      return;
    }

    setVisibleItems((currentItems) => {
      const gap = Number.parseFloat(window.getComputedStyle(chatStack).rowGap) || 0;
      const children = Array.from(chatStack.children) as HTMLElement[];
      const overflowAllowance = children[0] ? children[0].offsetHeight + gap : 0;

      if (
        currentItems.length <= 1 ||
        chatStack.scrollHeight <= chatStack.clientHeight + overflowAllowance
      ) {
        return currentItems;
      }

      const overflowHeight = chatStack.scrollHeight - chatStack.clientHeight - overflowAllowance;
      let removedHeight = 0;
      let removeCount = 0;

      for (const child of children.slice(0, -1)) {
        removedHeight += child.offsetHeight + gap;
        removeCount += 1;

        if (removedHeight >= overflowHeight) {
          break;
        }
      }

      return removeCount > 0 ? currentItems.slice(removeCount) : currentItems;
    });
  }, []);

  useLayoutEffect(() => {
    fitItemsToHeight();

    const chatStack = chatStackRef.current;

    if (!chatStack) {
      return;
    }

    const resizeObserver = new ResizeObserver(fitItemsToHeight);
    resizeObserver.observe(chatStack);

    return () => resizeObserver.disconnect();
  }, [fitItemsToHeight, visibleItems]);

  useEffect(() => {
    if (!broadcast) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`live-chat-overlay:${broadcast.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `broadcast_id=eq.${broadcast.id}`,
        },
        (payload) => {
          const message = payload.new as LiveMessageRow;

          if (message.message_type !== "chat") {
            return;
          }

          const item = mapLiveMessageToChatOverlayItem(message, {
            creatorId: broadcast.creatorId,
          });

          if (!item) {
            return;
          }

          setVisibleItems((currentItems) => [...currentItems, item]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [broadcast]);

  return (
    <main className="live-overlay-root min-h-screen overflow-hidden bg-transparent p-0 text-white">
      <section
        className={cn(
          "relative flex h-screen w-full flex-col justify-end overflow-hidden",
          "bg-transparent px-0 py-3",
        )}
      >
        <div
          ref={chatStackRef}
          className={cn(
            "flex h-full min-h-0 flex-col items-start justify-end gap-1.5 overflow-hidden",
            "live-chat-overlay-stack",
          )}
        >
          {visibleItems.map((item) => (
            <ChatMessageItem key={item.message.id} message={item.message} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ChatMessageItem({ message }: { message: LiveChatOverlayMessage }) {
  const nicknameColor = getNicknameColor(message.author, message.role);

  return (
    <p
      className={cn(
        "inline-block max-w-130 rounded-xl bg-black/50 px-3.5 py-2",
        "text-3xl leading-9 font-normal break-words",
      )}
    >
      <MessagePrefix role={message.role} />
      <span
        className={cn("mr-1.5 shrink-0 font-medium", message.tone === "muted" && "text-white/55")}
        style={message.tone === "muted" ? undefined : { color: nicknameColor }}
      >
        {message.author}
      </span>
      {message.content}
    </p>
  );
}

function getNicknameColor(author: string, role?: LiveChatOverlayMessage["role"]) {
  if (role === "creator") {
    return "#46c6a9";
  }

  const hash = Array.from(author).reduce((acc, character) => acc + character.charCodeAt(0), 0);

  return LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE[
    hash % LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE.length
  ];
}

function MessagePrefix({ role }: { role?: LiveChatOverlayMessage["role"] }) {
  if (role === "creator") {
    return (
      <span
        className={cn(
          "mt-0.5 mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md",
          "text-brand ring-brand/30 bg-black/50 shadow-md ring-1",
        )}
        aria-label="방장"
        title="방장"
      >
        <Crown className="size-4.5" aria-hidden />
      </span>
    );
  }
  return null;
}
