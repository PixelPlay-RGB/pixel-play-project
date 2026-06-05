"use client";
// 커뮤니티 게시글 단건을 조회합니다.

import { useQuery } from "@tanstack/react-query";

import { fetchCommunityPostDetailAction } from "@/actions/community/community";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { CommunityPostDetail } from "@/types/community/community";

export function useCommunityPostDetail(postId: string, initialData?: CommunityPostDetail) {
  return useQuery<CommunityPostDetail>({
    queryKey: QUERY_KEYS.community.post(postId),
    queryFn: async () => {
      const result = await fetchCommunityPostDetailAction(postId);

      if (!result.success || !result.data) {
        throw new Error(result.code ?? "community post load failed");
      }

      return result.data;
    },
    initialData,
  });
}
