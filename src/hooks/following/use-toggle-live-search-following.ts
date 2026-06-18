"use client";
// 라이브 검색 결과에서 크리에이터 팔로잉 상태를 토글합니다.
// 옵티미스틱 토글 골격은 use-optimistic-follow-toggle와 공유하고, 검색 캐시 업데이트만 주입합니다.

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useOptimisticFollowToggle } from "@/hooks/following/use-optimistic-follow-toggle";
import type { LiveSearchInfiniteData } from "@/types/following/live-search-following";

function updateLiveSearchFollowingState(
  data: LiveSearchInfiniteData | undefined,
  creatorId: string,
  nextFollowing: boolean,
): LiveSearchInfiniteData | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) =>
      page.map((item) => {
        if (item.creator_id !== creatorId) {
          return item;
        }

        const followerDelta = item.is_following === nextFollowing ? 0 : nextFollowing ? 1 : -1;

        return {
          ...item,
          follower_count: Math.max(0, item.follower_count + followerDelta),
          is_following: nextFollowing,
        };
      }),
    ),
  };
}

export function useToggleLiveSearchFollowing() {
  return useOptimisticFollowToggle<LiveSearchInfiniteData>({
    queryKey: QUERY_KEYS.live.searchAll(),
    updater: updateLiveSearchFollowingState,
  });
}
