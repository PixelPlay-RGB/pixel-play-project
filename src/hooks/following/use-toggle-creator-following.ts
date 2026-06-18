"use client";
// 크리에이터 팔로잉 상태 변경과 라이브 캐시 갱신을 관리합니다.
// 옵티미스틱 토글 골격은 use-optimistic-follow-toggle와 공유하고, 라이브 목록 캐시 업데이트만 주입합니다.

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useOptimisticFollowToggle } from "@/hooks/following/use-optimistic-follow-toggle";
import type { LiveListSnapshot } from "@/types/live/live";

function updateLiveListFollowingState(
  data: LiveListSnapshot | undefined,
  creatorId: string,
  nextFollowing: boolean,
): LiveListSnapshot | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    items: data.items.map((item) =>
      item.creatorId === creatorId
        ? {
            ...item,
            isFollowing: nextFollowing,
          }
        : item,
    ),
  };
}

export function useToggleCreatorFollowing() {
  return useOptimisticFollowToggle<LiveListSnapshot>({
    queryKey: QUERY_KEYS.live.listAll(),
    updater: updateLiveListFollowingState,
    // 라이브 목록 전체 + 팔로잉 페이지 목록도 함께 갱신해 토글 결과가 즉시 반영되도록 합니다.
    invalidateKeys: [QUERY_KEYS.live.all, QUERY_KEYS.following.all],
  });
}
