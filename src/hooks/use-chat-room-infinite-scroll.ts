"use client";
// 채팅방 목록 무한스크롤 표시 개수와 sentinel ref를 관리하는 훅

import { CHAT_ROOM_PAGE_SIZE } from "@/hooks/use-chat-rooms";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import type { ChatRoomByTab, ChatRoomTab } from "@/types/chat-room";
import { useCallback, useEffect, useState } from "react";

export function useChatRoomInfiniteScroll(allChatrooms: ChatRoomByTab[], tabType: ChatRoomTab) {
  const [visibleCount, setVisibleCount] = useState(CHAT_ROOM_PAGE_SIZE);

  // 탭이 변경되면 표시 개수를 초기화한다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(CHAT_ROOM_PAGE_SIZE);
  }, [tabType]);

  const totalCount = allChatrooms.length;
  const visibleChatrooms = allChatrooms.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) => Math.min(prev + CHAT_ROOM_PAGE_SIZE, totalCount));
    }
  }, [hasMore, totalCount]);

  const sentinelRef = useIntersectionObserver(loadMore);

  return { visibleChatrooms, hasMore, totalCount, sentinelRef };
}
