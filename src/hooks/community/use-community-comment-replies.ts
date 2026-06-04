"use client";
// 대댓글 목록을 "답글 N∨" 토글 시 지연 로드합니다.

import { useQuery } from "@tanstack/react-query";

import { fetchCommunityCommentRepliesAction } from "@/actions/community/community";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { CommunityComment } from "@/types/community/community";

export function useCommunityCommentReplies(commentId: string, enabled: boolean) {
  return useQuery<CommunityComment[]>({
    queryKey: QUERY_KEYS.community.commentReplies(commentId),
    queryFn: async () => {
      const result = await fetchCommunityCommentRepliesAction(commentId);

      if (!result.success || !result.data) {
        throw new Error(result.code ?? "community comment replies load failed");
      }

      return result.data;
    },
    enabled,
  });
}
