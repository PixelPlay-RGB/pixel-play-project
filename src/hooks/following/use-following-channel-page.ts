"use client";
// 팔로잉 채널 페이지 목록 데이터를 페이지 단위로 조회합니다.

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { FOLLOWING_PAGE_SIZE } from "@/constants/following/following-page";
import { fetchFollowingChannelPage } from "@/hooks/following/following-page-query";
import { useNullableUser } from "@/hooks/profile/use-profile";
import type { FollowingChannelFilter } from "@/types/following/following-page";

export function useFollowingChannelPage(filter: FollowingChannelFilter, page: number) {
  const userQuery = useNullableUser();
  const viewerId = userQuery.data?.id;

  const query = useQuery({
    queryKey: QUERY_KEYS.following.page(viewerId, filter, page),
    queryFn: () =>
      fetchFollowingChannelPage({
        filter,
        limit: FOLLOWING_PAGE_SIZE,
        offset: (page - 1) * FOLLOWING_PAGE_SIZE,
      }),
    enabled: Boolean(viewerId),
    placeholderData: keepPreviousData,
  });

  const snapshot = query.data;
  const filteredCount = snapshot?.filteredCount ?? 0;

  return {
    viewerId,
    isSignedIn: Boolean(viewerId),
    isUserFetched: userQuery.isFetched,
    items: snapshot?.items ?? [],
    totalCount: snapshot?.totalCount ?? 0,
    liveCount: snapshot?.liveCount ?? 0,
    recentBroadcastCount: snapshot?.recentBroadcastCount ?? 0,
    filteredCount,
    totalPages: Math.max(1, Math.ceil(filteredCount / FOLLOWING_PAGE_SIZE)),
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    refetch: query.refetch,
  };
}
