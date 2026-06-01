"use client";
// 팔로잉 채널 페이지 목록 데이터를 조회합니다.

import { useInfiniteQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { FOLLOWING_PAGE_SIZE } from "@/constants/following/following-page";
import { fetchFollowingChannelPage } from "@/hooks/following/following-page-query";
import { useNullableUser } from "@/hooks/profile/use-profile";

export function useFollowingChannelPage() {
  const userQuery = useNullableUser();
  const viewerId = userQuery.data?.id;

  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.following.page(viewerId),
    queryFn: ({ pageParam }) =>
      fetchFollowingChannelPage({ limit: FOLLOWING_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) {
        return undefined;
      }

      return pages.reduce((total, page) => total + page.items.length, 0);
    },
    enabled: Boolean(viewerId),
  });

  const firstPage = query.data?.pages[0];
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    viewerId,
    isSignedIn: Boolean(viewerId),
    isUserFetched: userQuery.isFetched,
    items,
    totalCount: firstPage?.totalCount ?? 0,
    liveCount: firstPage?.liveCount ?? 0,
    recentBroadcastCount: firstPage?.recentBroadcastCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
