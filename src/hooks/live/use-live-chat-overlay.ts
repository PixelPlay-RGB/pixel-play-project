"use client";
// OBS 채팅 오버레이의 실시간 메시지와 높이 보정 상태를 관리합니다.

import { LIVE_CHAT_OVERLAY_MESSAGE_LIMIT } from "@/constants/live/live-overlay";
import { createClient } from "@/lib/supabase/client";
import type { LiveMessageRow } from "@/types/live/live";
import type { LiveChatOverlayItem, LiveChatOverlaySnapshot } from "@/types/live/live-chat-overlay";
import { mapLiveMessageToChatOverlayItem } from "@/utils/live/live-overlay-message";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export function useLiveChatOverlay(creatorId: string, initialSnapshot: LiveChatOverlaySnapshot) {
  const chatStackRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<LiveChatOverlayItem[]>(initialSnapshot.items);
  const donationMessageEnabled = initialSnapshot.donationMessageEnabled;
  const donationAmountVisible = initialSnapshot.donationAmountVisible;

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

  // 채팅은 채널 단위(#111) — 방송 중이 아니어도 채널 메시지를 실시간으로 받는다.
  useEffect(() => {
    if (!creatorId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`live-chat-overlay:${creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          const message = payload.new as LiveMessageRow;

          const item = mapLiveMessageToChatOverlayItem(message, {
            creatorId,
            donationMessageEnabled,
            amountVisible: donationAmountVisible,
          });

          if (!item) {
            return;
          }

          setVisibleItems((currentItems) => {
            const nextItems = [...currentItems, item];

            return nextItems.length > LIVE_CHAT_OVERLAY_MESSAGE_LIMIT
              ? nextItems.slice(-LIVE_CHAT_OVERLAY_MESSAGE_LIMIT)
              : nextItems;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [creatorId, donationMessageEnabled, donationAmountVisible]);

  return {
    chatStackRef,
    visibleItems,
  };
}
