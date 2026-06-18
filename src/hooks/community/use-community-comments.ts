"use client";
// 게시글 상위 댓글 목록을 정렬·페이지 단위로 조회합니다.

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchCommunityCommentsAction } from "@/actions/community/community";
import { COMMUNITY_COMMENT_DEFAULT_SORT } from "@/constants/community/community";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { CommunityCommentSort, CommunityCommentsResult } from "@/types/community/community";

export function useCommunityComments(
  postId: string,
  page: number,
  sort: CommunityCommentSort,
  initialData?: CommunityCommentsResult,
) {
  return useQuery<CommunityCommentsResult>({
    queryKey: QUERY_KEYS.community.comments(postId, sort, page),
    queryFn: async () => {
      const result = await fetchCommunityCommentsAction(postId, page, sort);

      if (!result.success || !result.data) {
        throw new Error(result.code ?? "community comments load failed");
      }

      return result.data;
    },
    // SSR 초기 데이터는 기본 정렬·첫 페이지에만 유효.
    initialData: page === 1 && sort === COMMUNITY_COMMENT_DEFAULT_SORT ? initialData : undefined,
    placeholderData: keepPreviousData,
  });
}
