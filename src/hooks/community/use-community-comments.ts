"use client";
// 게시글 상위 댓글 목록을 정렬 단위로 "댓글 더보기"(무한 로드)로 조회합니다.
// 대댓글(use-community-comment-replies)과 동일한 load-more UX로 결을 맞춘다.

import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchCommunityCommentsAction } from "@/actions/community/community";
import {
  COMMUNITY_COMMENT_DEFAULT_SORT,
  COMMUNITY_COMMENT_PAGE_SIZE,
} from "@/constants/community/community";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { CommunityCommentSort, CommunityCommentsResult } from "@/types/community/community";

export function useCommunityComments(
  postId: string,
  sort: CommunityCommentSort,
  initialData?: CommunityCommentsResult,
) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.community.comments(postId, sort),
    queryFn: async ({ pageParam }) => {
      const result = await fetchCommunityCommentsAction(postId, pageParam, sort);

      if (!result.success || !result.data) {
        throw new Error(result.code ?? "community comments load failed");
      }

      return result.data;
    },
    initialPageParam: 1,
    // 기존 페이지네이션과 동일하게 totalCount 기준 총 페이지 수까지만 더 불러온다.
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < Math.ceil(lastPage.totalCount / COMMUNITY_COMMENT_PAGE_SIZE)
        ? allPages.length + 1
        : undefined,
    // SSR 초기 데이터는 기본 정렬 첫 페이지에만 유효.
    initialData:
      initialData && sort === COMMUNITY_COMMENT_DEFAULT_SORT
        ? { pages: [initialData], pageParams: [1] }
        : undefined,
  });
}
