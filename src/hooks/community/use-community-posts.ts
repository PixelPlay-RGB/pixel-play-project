"use client";
// 채널 커뮤니티 게시글 목록을 페이지 단위로 조회합니다.

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchChannelCommunityPostsAction } from "@/actions/community/community";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { CommunityPostsResult } from "@/types/community/community";

export function useCommunityPosts(
  creatorId: string,
  page: number,
  initialData?: CommunityPostsResult,
) {
  return useQuery<CommunityPostsResult>({
    queryKey: QUERY_KEYS.community.posts(creatorId, page),
    queryFn: async () => {
      const result = await fetchChannelCommunityPostsAction(creatorId, page);

      if (!result.success || !result.data) {
        throw new Error(result.code ?? "community posts load failed");
      }

      return result.data;
    },
    initialData: page === 1 ? initialData : undefined,
    placeholderData: keepPreviousData,
  });
}
