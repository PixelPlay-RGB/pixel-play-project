"use client";
// 메시지 목록 viewport 스크롤 위치와 최신 메시지 이동 상태를 관리하는 hook
import { useCallback, useLayoutEffect, useRef, useState, type UIEvent } from "react";

import {
  MESSAGE_LIST_LATEST_THRESHOLD_PX,
  MESSAGE_LIST_TOP_PREFETCH_PX,
} from "@/constants/message";
import type { MessageQuery } from "@/types/message";
import { getLatestMessageDistance } from "@/utils/message";

interface UseMessageListViewportOptions {
  messages: MessageQuery[];
  currentUserId: string;
  hasMorePrevious: boolean;
  isLoadingPrevious: boolean;
  onReachTop: () => boolean;
}

export function useMessageListViewport({
  messages,
  currentUserId,
  hasMorePrevious,
  isLoadingPrevious,
  onReachTop,
}: UseMessageListViewportOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const prevNewestIdRef = useRef<string | null>(null);
  const prevOldestIdRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef(0);
  const isNearLatestRef = useRef(true);
  const [showLatestButton, setShowLatestButton] = useState(false);

  const isNearLatest = useCallback((viewport: HTMLDivElement) => {
    return getLatestMessageDistance(viewport) <= MESSAGE_LIST_LATEST_THRESHOLD_PX;
  }, []);

  const updateLatestButton = useCallback(
    (viewport: HTMLDivElement) => {
      const nextIsNearLatest = isNearLatest(viewport);
      isNearLatestRef.current = nextIsNearLatest;
      setShowLatestButton(!nextIsNearLatest);
    },
    [isNearLatest],
  );

  const scrollToLatest = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTop = Math.max(viewport.scrollHeight - viewport.clientHeight, 0);
    isNearLatestRef.current = true;
    setShowLatestButton(false);
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const newestMessage = messages[0] ?? null;
    const newestId = newestMessage?.id ?? null;
    const oldestId = messages.at(-1)?.id ?? null;
    const prevNewest = prevNewestIdRef.current;
    const prevOldest = prevOldestIdRef.current;
    const hasNewerMessage = newestId !== prevNewest && oldestId === prevOldest;
    const hasOlderMessage = oldestId !== prevOldest && newestId === prevNewest;
    const prevNewestIndex = prevNewest
      ? messages.findIndex((message) => message.id === prevNewest)
      : -1;
    const newerMessages =
      hasNewerMessage && prevNewestIndex > 0 ? messages.slice(0, prevNewestIndex) : [];
    const hasOwnNewerMessage = newerMessages.some((message) => message.user_id === currentUserId);

    if (prevOldest === null) {
      scrollToLatest();
    } else if (hasNewerMessage) {
      if (isNearLatestRef.current || hasOwnNewerMessage) {
        scrollToLatest();
      } else {
        setShowLatestButton(true);
      }
    } else if (hasOlderMessage) {
      const diff = viewport.scrollHeight - prevScrollHeightRef.current;
      if (diff !== 0) {
        viewport.scrollTop += diff;
      }
      updateLatestButton(viewport);
    } else {
      updateLatestButton(viewport);
    }

    prevNewestIdRef.current = newestId;
    prevOldestIdRef.current = oldestId;
    prevScrollHeightRef.current = viewport.scrollHeight;
  }, [currentUserId, messages, scrollToLatest, updateLatestButton]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const viewport = event.currentTarget;
      updateLatestButton(viewport);

      const isNearTop = viewport.scrollTop <= MESSAGE_LIST_TOP_PREFETCH_PX;
      if (isNearTop && hasMorePrevious && !isLoadingPrevious) {
        onReachTop();
      }
    },
    [hasMorePrevious, isLoadingPrevious, onReachTop, updateLatestButton],
  );

  return {
    viewportRef,
    showLatestButton,
    handleScroll,
    scrollToLatest,
  };
}
