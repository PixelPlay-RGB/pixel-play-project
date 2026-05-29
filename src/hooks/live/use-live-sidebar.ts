"use client";
// 라이브 Sidebar에 표시할 독립 목록 데이터를 조회합니다.

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import {
  LIVE_SIDEBAR_CHANNEL_LIMIT,
  LIVE_SIDEBAR_FOLLOWING_MAX_VISIBLE_COUNT,
  LIVE_SIDEBAR_KEYWORD_LIMIT,
} from "@/constants/live/live-sidebar";
import { fetchLiveListSnapshot } from "@/hooks/live/live-list-query";
import {
  fetchFollowingChannelSnapshot,
  fetchLivePopularKeywordSnapshot,
} from "@/hooks/live/live-sidebar-query";
import { useNullableUser } from "@/hooks/profile/use-profile";

export function useLiveSidebar() {
  const userQuery = useNullableUser();
  const viewerId = userQuery.data?.id;

  const trendingQuery = useQuery({
    queryKey: QUERY_KEYS.live.sidebar.trending(viewerId),
    queryFn: () =>
      fetchLiveListSnapshot({
        filter: "ALL",
        sort: "VIEWER_COUNT_DESC",
        viewerId,
        limit: LIVE_SIDEBAR_CHANNEL_LIMIT,
      }),
    enabled: userQuery.isFetched,
  });

  const followingQuery = useInfiniteQuery({
    queryKey: QUERY_KEYS.live.sidebar.following(viewerId),
    queryFn: ({ pageParam }) =>
      fetchFollowingChannelSnapshot({
        limit: LIVE_SIDEBAR_CHANNEL_LIMIT,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((total, page) => total + page.items.length, 0);

      if (!lastPage.hasMore || nextOffset >= LIVE_SIDEBAR_FOLLOWING_MAX_VISIBLE_COUNT) {
        return undefined;
      }

      return nextOffset;
    },
    enabled: userQuery.isFetched && Boolean(viewerId),
  });

  const keywordQuery = useQuery({
    queryKey: QUERY_KEYS.live.sidebar.keywords(),
    queryFn: () => fetchLivePopularKeywordSnapshot(LIVE_SIDEBAR_KEYWORD_LIMIT),
  });

  const followingItems =
    followingQuery.data?.pages
      .flatMap((page) => page.items)
      .slice(0, LIVE_SIDEBAR_FOLLOWING_MAX_VISIBLE_COUNT) ?? [];
  const followingTotalCount = followingQuery.data?.pages[0]?.totalCount ?? 0;

  return {
    isSignedIn: Boolean(viewerId),
    trendingItems: trendingQuery.data?.items ?? [],
    followingItems,
    keywordItems: keywordQuery.data?.items ?? [],
    followingTotalCount,
    fetchMoreFollowing: followingQuery.fetchNextPage,
    canFetchMoreFollowing: Boolean(followingQuery.hasNextPage),
    isFetchingMoreFollowing: followingQuery.isFetchingNextPage,
    isTrendingLoading: trendingQuery.isLoading,
    isFollowingLoading: followingQuery.isLoading,
    isKeywordLoading: keywordQuery.isLoading,
  };
}
