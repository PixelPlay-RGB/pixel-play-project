// 방송 운영 채팅 실시간 구독 상태를 관리합니다.
"use client";

import type { ChannelLiveChatMessage } from "@/actions/channel/live";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database.types";
import type { LiveMessageRow } from "@/types/live/live";
import { useCallback, useEffect, useState } from "react";

const CHANNEL_LIVE_CHAT_MESSAGE_LIMIT = 50;

function readJsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

function readString(value: Json | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed.length > 0 ? trimmed : null;
}

function toChannelLiveChatMessage(message: LiveMessageRow): ChannelLiveChatMessage | null {
  if (message.message_type !== "chat") {
    return null;
  }

  const metadata = readJsonObject(message.metadata);

  return {
    authorName: readString(metadata.senderNickname) ?? "시청자",
    content: message.content,
    createdAt: message.created_at,
    id: message.id,
    isCreator: readString(metadata.senderRole) === "creator",
  };
}

function appendUniqueMessage(
  currentMessages: ChannelLiveChatMessage[],
  nextMessage: ChannelLiveChatMessage,
) {
  if (currentMessages.some((message) => message.id === nextMessage.id)) {
    return currentMessages;
  }

  return [...currentMessages, nextMessage].slice(-CHANNEL_LIVE_CHAT_MESSAGE_LIMIT);
}

export function useChannelLiveChatSubscription({
  broadcastId,
  initialMessages,
}: {
  broadcastId?: string | null;
  initialMessages: ChannelLiveChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);

  const appendMessage = useCallback((nextMessage: ChannelLiveChatMessage) => {
    setMessages((currentMessages) => appendUniqueMessage(currentMessages, nextMessage));
  }, []);

  useEffect(() => {
    if (!broadcastId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`channel-live-chat:${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `broadcast_id=eq.${broadcastId}`,
          schema: "public",
          table: "live_message",
        },
        (payload) => {
          const nextMessage = toChannelLiveChatMessage(payload.new as LiveMessageRow);

          if (!nextMessage) return;

          appendMessage(nextMessage);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [appendMessage, broadcastId]);

  return {
    appendMessage,
    messages,
  };
}
