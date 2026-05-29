"use client";

import { useEffect, useRef } from "react";
import { LIVE_LABEL } from "@/constants/live/live";
import { formatDonationAmount } from "@/utils/live/live-chat";
import type { LiveChatMessage } from "@/types/live/live";

interface Props {
  messages: LiveChatMessage[];
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

export function LiveChatMessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
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

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 60) {
      el.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  return (
    <>
      <ul className="flex flex-col gap-1 px-3 py-2">
        {messages.map((msg) => (
          <li key={msg.id}>
            <MessageItem message={msg} />
          </li>
        ))}
      </ul>
      <div ref={bottomRef} />
    </>
  );
}

interface MessageItemProps {
  message: LiveChatMessage;
}

function MessageItem({ message }: MessageItemProps) {
  if (message.type === "system") {
    return (
      <p className="text-muted-foreground my-1 text-center text-xs">
        {message.content}
      </p>
    );
  }

  if (message.type === "filtered") {
    return (
      <p className="text-muted-foreground my-1 text-center text-xs">
        {LIVE_LABEL.filteredMessage}
      </p>
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
          <span className="text-foreground text-xs font-medium">{message.author}</span>
        </div>
        {message.content ? <p className="text-foreground">{message.content}</p> : null}
      </div>
    );
  }

  return (
    <p className="py-0.5 text-sm leading-snug">
      <span className="text-brand mr-1.5 font-medium">{message.author}</span>
      <span className="text-foreground">{message.content}</span>
    </p>
  );
}
