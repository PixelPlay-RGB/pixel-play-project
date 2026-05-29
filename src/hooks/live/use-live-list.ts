"use client";
// 라이브 목록 RPC snapshot을 조회하는 훅입니다.

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useNullableUser } from "@/hooks/profile/use-profile";
import { createClient } from "@/lib/supabase/client";
import { useLiveStore } from "@/stores/live";
import type { LiveListFilter, LiveListSnapshot, LiveListSort } from "@/types/live/live";
import { parseLiveListSnapshot } from "@/utils/live/live-list";

async function fetchLiveList({
  filter,
  sort,
  viewerId,
  limit,
}: {
  filter: LiveListFilter;
  sort: LiveListSort;
  viewerId?: string;
  limit: number;
}): Promise<LiveListSnapshot> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_live_list", {
    p_filter: filter,
    p_sort: sort,
    p_viewer_id: viewerId,
    p_query: undefined,
    p_limit: limit,
    p_offset: 0,
  });

  if (error) {
    console.error("라이브 목록 조회 실패", error);
    throw error;
  }

  return parseLiveListSnapshot(data);
}

export function useLiveList() {
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
      fetchLiveList({
        filter: effectiveFilter,
        sort,
        viewerId,
        limit: visibleCount,
      }),
    enabled: userQuery.isFetched,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });

  return {
    ...query,
    filter,
    effectiveFilter,
    sort,
    visibleCount,
    isUserFetched: userQuery.isFetched,
    isFollowingFilterVisible: Boolean(viewerId),
    userError: userQuery.error,
    isUserError: userQuery.isError,
  };
}
