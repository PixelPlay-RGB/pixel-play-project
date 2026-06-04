"use client";
// 대댓글 목록을 "답글 N∨" 토글 시 지연 로드하고, "답글 더보기"로 추가 페이지를 불러옵니다.

import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchCommunityCommentRepliesAction } from "@/actions/community/community";
import { QUERY_KEYS } from "@/constants/common/query-keys";

export function useCommunityCommentReplies(commentId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.community.commentReplies(commentId),
    queryFn: async ({ pageParam }) => {
      const result = await fetchCommunityCommentRepliesAction(commentId, pageParam);

      if (!result.success || !result.data) {
        throw new Error(result.code ?? "community comment replies load failed");
      }

      return result.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length + 1 : undefined),
    enabled,
  });
}
