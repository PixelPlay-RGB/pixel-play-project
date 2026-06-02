"use client";
// 커뮤니티 게시글의 댓글 목록을 페이지 단위로 조회합니다.

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchCommunityCommentsAction } from "@/actions/community/community";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { CommunityCommentsResult } from "@/types/community/community";

export function useCommunityComments(
  postId: string,
  page: number,
  initialData?: CommunityCommentsResult,
) {
  return useQuery<CommunityCommentsResult>({
    queryKey: QUERY_KEYS.community.comments(postId, page),
    queryFn: async () => {
      const result = await fetchCommunityCommentsAction(postId, page);

      if (!result.success || !result.data) {
        throw new Error(result.code ?? "community comments load failed");
      }

      return result.data;
    },
    initialData: page === 1 ? initialData : undefined,
    placeholderData: keepPreviousData,
  });
}
