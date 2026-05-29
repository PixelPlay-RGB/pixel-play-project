// 라이브 목록 화면의 필터, 정렬, 표시 개수를 관리합니다.

import {
  LIVE_LIST_DEFAULT_FILTER,
  LIVE_LIST_DEFAULT_SORT,
  LIVE_LIST_PAGE_SIZE,
} from "@/constants/live/live-list";
import type { LiveListFilter, LiveListSort } from "@/types/live/live";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LiveState {
  filter: LiveListFilter;
  sort: LiveListSort;
  visibleCount: number;
  setFilter: (filter: LiveListFilter) => void;
  setSort: (sort: LiveListSort) => void;
  showMore: () => void;
  reset: () => void;
}

function getDefaultSortByFilter(filter: LiveListFilter): LiveListSort {
  if (filter === "RECENT") {
    return "STARTED_AT_DESC";
  }

  if (filter === "ACTIVE_CHAT") {
    return "RECENT_CHAT_DESC";
  }

  return LIVE_LIST_DEFAULT_SORT;
}

export const useLiveStore = create<LiveState>()(
  devtools(
    (set) => ({
      filter: LIVE_LIST_DEFAULT_FILTER,
      sort: LIVE_LIST_DEFAULT_SORT,
      visibleCount: LIVE_LIST_PAGE_SIZE,
      setFilter: (filter) =>
        set(
          {
            filter,
            sort: getDefaultSortByFilter(filter),
            visibleCount: LIVE_LIST_PAGE_SIZE,
          },
          false,
          "live/setFilter",
        ),
      setSort: (sort) =>
        set(
          {
            sort,
            visibleCount: LIVE_LIST_PAGE_SIZE,
          },
          false,
          "live/setSort",
        ),
      showMore: () =>
        set(
          (state) => ({
            visibleCount: state.visibleCount + LIVE_LIST_PAGE_SIZE,
          }),
          false,
          "live/showMore",
        ),
      reset: () =>
        set(
          {
            filter: LIVE_LIST_DEFAULT_FILTER,
            sort: LIVE_LIST_DEFAULT_SORT,
            visibleCount: LIVE_LIST_PAGE_SIZE,
          },
          false,
          "live/reset",
        ),
    }),
    {
      name: "LiveStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
