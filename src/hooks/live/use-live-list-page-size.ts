"use client";
// 라이브 목록 grid 열 수에 맞는 page size를 계산하는 hook

import { useEffect, useRef, useState } from "react";

import {
  LIVE_LIST_GRID_BREAKPOINTS,
  LIVE_LIST_PAGE_SIZE_BY_COLUMN_COUNT,
} from "@/constants/live/live-list";

interface UseLiveListPageSizeOptions {
  onPageSizeChange?: (pageSize: number) => void;
}

function resolveLiveListPageSize(width: number) {
  if (width >= LIVE_LIST_GRID_BREAKPOINTS["2xl"]) {
    return LIVE_LIST_PAGE_SIZE_BY_COLUMN_COUNT.four;
  }

  if (width >= LIVE_LIST_GRID_BREAKPOINTS.xl) {
    return LIVE_LIST_PAGE_SIZE_BY_COLUMN_COUNT.three;
  }

  if (width >= LIVE_LIST_GRID_BREAKPOINTS.sm) {
    return LIVE_LIST_PAGE_SIZE_BY_COLUMN_COUNT.two;
  }

  return LIVE_LIST_PAGE_SIZE_BY_COLUMN_COUNT.one;
}

export function useLiveListPageSize({ onPageSizeChange }: UseLiveListPageSizeOptions = {}) {
  const [pageSize, setPageSize] = useState<number | null>(null);
  const previousPageSizeRef = useRef<number | null>(null);

  useEffect(() => {
    const updatePageSize = () => {
      const nextPageSize = resolveLiveListPageSize(window.innerWidth);

      if (previousPageSizeRef.current === nextPageSize) return;

      previousPageSizeRef.current = nextPageSize;
      setPageSize(nextPageSize);
      onPageSizeChange?.(nextPageSize);
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => {
      window.removeEventListener("resize", updatePageSize);
    };
  }, [onPageSizeChange]);

  return pageSize;
}
