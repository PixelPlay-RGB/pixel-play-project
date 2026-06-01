"use client";
// 라이브 목록 RPC snapshot을 조회하는 훅입니다.

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useNullableUser } from "@/hooks/profile/use-profile";
import { fetchLiveListSnapshot } from "@/hooks/live/live-list-query";
import { useLiveStore } from "@/stores/live";
import type { LiveListFilter, LiveListSnapshot } from "@/types/live/live";

export function useLiveList(isPageSizeReady = true) {
  const filter = useLiveStore((state) => state.filter);
  const sort = useLiveStore((state) => state.sort);
  const visibleCount = useLiveStore((state) => state.visibleCount);
  const userQuery = useNullableUser();
  const currentUser = userQuery.data ?? null;
  const viewerId = currentUser?.id;
  const effectiveFilter: LiveListFilter = viewerId || filter !== "FOLLOWING" ? filter : "ALL";

  const query = useQuery<LiveListSnapshot>({
    queryKey: QUERY_KEYS.live.list(viewerId, effectiveFilter, sort, visibleCount),
    queryFn: () =>
      fetchLiveListSnapshot({
        filter: effectiveFilter,
        sort,
        limit: visibleCount,
      }),
    enabled: isPageSizeReady,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });

  return {
    ...query,
    filter,
    effectiveFilter,
    sort,
    visibleCount,
    isPageSizeReady,
    isUserFetched: userQuery.isFetched,
    isFollowingFilterVisible: Boolean(viewerId),
    userError: userQuery.error,
    isUserError: userQuery.isError,
  };
}
