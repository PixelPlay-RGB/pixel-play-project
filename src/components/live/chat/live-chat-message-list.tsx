"use client";
// 라이브 채팅 메시지 목록을 렌더링하고 하단 근접 시 자동 스크롤을 처리합니다.

import { useEffect, useLayoutEffect, useRef } from "react";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { formatDonationAmount } from "@/utils/live/live-chat";
import type { LiveChatMessage } from "@/types/live/live";

interface Props {
  messages: LiveChatMessage[];
  fillHeight?: boolean;
}

function getScrollContainer(el: HTMLElement): HTMLElement | null {
  let parent: HTMLElement | null = el.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") return parent;
    parent = parent.parentElement;
  }
  return null;
}

export function LiveChatMessageList({ messages, fillHeight = false }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const wasNearBottomRef = useRef(true);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const container = getScrollContainer(el);
    if (!container) return;

    const updateNearBottom = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      wasNearBottomRef.current = distanceFromBottom < 60;
    };

    updateNearBottom();
    container.addEventListener("scroll", updateNearBottom, { passive: true });

    return () => {
      container.removeEventListener("scroll", updateNearBottom);
    };
  }, []);

  useLayoutEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      el.scrollIntoView({ block: "end" });
      return;
    }

    const container = getScrollContainer(el);
    if (!container) {
      el.scrollIntoView({ block: "end" });
      return;
    }

    if (wasNearBottomRef.current) {
      el.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  return (
    <div className={cn(fillHeight && "flex min-h-full flex-col justify-end")}>
      <ul className="flex flex-col gap-1 px-3 py-2">
        {messages.map((msg) => (
          <li key={msg.id}>
            <MessageItem message={msg} />
          </li>
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}

interface MessageItemProps {
  message: LiveChatMessage;
}

function MessageItem({ message }: MessageItemProps) {
  if (message.type === "system") {
    return (
      <p className="text-muted-foreground my-1 text-center text-xs wrap-break-word">
        {message.content}
      </p>
    );
  }

  if (message.type === "filtered") {
    return (
      <p className="text-muted-foreground my-1 text-center text-xs">{LIVE_LABEL.filteredMessage}</p>
    );
  }

  if (message.type === "donation") {
    return (
      <div className="border-live/20 bg-live/10 rounded-lg border px-3 py-2 text-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-live font-semibold">
            {message.donationAmount !== undefined
              ? `${formatDonationAmount(message.donationAmount)}P`
              : ""}
          </span>
          <span className="text-foreground min-w-0 text-xs font-medium wrap-break-word">
            {message.author}
          </span>
        </div>
        {message.content ? <p className="text-foreground wrap-break-word">{message.content}</p> : null}
      </div>
    );
  }

  return (
    <p className="py-0.5 text-sm leading-snug wrap-break-word">
      <span className={cn("mr-1.5 font-medium", message.isHost ? "text-live" : "text-brand")}>
        {message.author}
      </span>
      <span className="text-foreground">{message.content}</span>
    </p>
  );
}
