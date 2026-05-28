"use client";
// 라이브 채팅 메시지 목록을 렌더링합니다. 시청 화면과 팝아웃 양쪽에서 재사용됩니다.

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { LIVE_LABEL } from "@/constants/live/live";
import { formatDonationAmount } from "@/utils/live/live-chat";
import type { LiveChatMessage } from "@/types/live/live";

interface Props {
  messages: LiveChatMessage[];
}

export function LiveChatMessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
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
      <div className={cn("border-live/20 bg-live/10 rounded-lg border px-3 py-2", "text-sm")}>
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
