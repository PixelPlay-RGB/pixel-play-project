"use client";
// 라이브 Sidebar에 표시할 독립 목록 데이터를 조회합니다.

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useCallback } from "react";

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

type FollowingChannelPage = Awaited<ReturnType<typeof fetchFollowingChannelSnapshot>>;

export function useLiveSidebar() {
  const queryClient = useQueryClient();
  const userQuery = useNullableUser();
  const viewerId = userQuery.data?.id;

  const trendingQuery = useQuery({
    queryKey: QUERY_KEYS.live.sidebar.trending(viewerId),
    queryFn: () =>
      fetchLiveListSnapshot({
        filter: "ALL",
        sort: "VIEWER_COUNT_DESC",
        limit: LIVE_SIDEBAR_CHANNEL_LIMIT,
      }),
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
    enabled: Boolean(viewerId),
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

  // 팔로잉 섹션을 접으면 누적된 "더보기" 페이지를 첫 페이지(초기 노출 개수)로 되돌린다.
  // refetch 없이 캐시를 잘라내며, 다시 펼쳤을 때 더보기 버튼이 초기 상태로 복원된다.
  const resetFollowing = useCallback(() => {
    queryClient.setQueryData<InfiniteData<FollowingChannelPage>>(
      QUERY_KEYS.live.sidebar.following(viewerId),
      (current) => {
        if (!current || current.pages.length <= 1) return current;
        return {
          pages: current.pages.slice(0, 1),
          pageParams: current.pageParams.slice(0, 1),
        };
      },
    );
  }, [queryClient, viewerId]);

  return {
    viewerId,
    isSignedIn: Boolean(viewerId),
    trendingItems: trendingQuery.data?.items ?? [],
    followingItems,
    keywordItems: keywordQuery.data?.items ?? [],
    followingTotalCount,
    fetchMoreFollowing: followingQuery.fetchNextPage,
    resetFollowing,
    canFetchMoreFollowing: Boolean(followingQuery.hasNextPage),
    isFetchingMoreFollowing: followingQuery.isFetchingNextPage,
    isTrendingLoading: trendingQuery.isLoading,
    isFollowingLoading: followingQuery.isLoading,
    isKeywordLoading: keywordQuery.isLoading,
  };
}
