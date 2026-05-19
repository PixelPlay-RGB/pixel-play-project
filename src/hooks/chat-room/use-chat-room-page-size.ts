// 채팅방 목록 grid 열 수에 맞는 page size를 계산하는 hook
"use client";

import { useEffect, useRef, useState } from "react";

import {
  CHAT_ROOM_GRID_BREAKPOINTS,
  CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT,
} from "@/constants/chat-room/chat-room";

interface UseChatRoomPageSizeOptions {
  onPageSizeChange?: () => void;
}

function resolveChatRoomPageSize(width: number) {
  if (width >= CHAT_ROOM_GRID_BREAKPOINTS.twoXl) {
    return CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT.four;
  }

  if (width >= CHAT_ROOM_GRID_BREAKPOINTS.xl) {
    return CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT.three;
  }

  if (width >= CHAT_ROOM_GRID_BREAKPOINTS.sm) {
    return CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT.two;
  }

  return CHAT_ROOM_PAGE_SIZE_BY_COLUMN_COUNT.one;
}

export function useChatRoomPageSize({ onPageSizeChange }: UseChatRoomPageSizeOptions = {}) {
  const [pageSize, setPageSize] = useState<number | null>(null);
  const previousPageSizeRef = useRef<number | null>(null);

  useEffect(() => {
    const updatePageSize = () => {
      const nextPageSize = resolveChatRoomPageSize(window.innerWidth);
      const previousPageSize = previousPageSizeRef.current;

      if (previousPageSize === nextPageSize) return;

      previousPageSizeRef.current = nextPageSize;
      setPageSize(nextPageSize);

      if (previousPageSize !== null) {
        onPageSizeChange?.();
      }
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => {
      window.removeEventListener("resize", updatePageSize);
    };
  }, [onPageSizeChange]);

  return pageSize;
}
