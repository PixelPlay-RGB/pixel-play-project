"use client";
// 게시글 삭제 mutation(하드 딜리트). 성공 시 목록 캐시를 무효화합니다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteCommunityPostAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type { CommunityPostsResult } from "@/types/community/community";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export function useDeleteCommunityPost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation<AppActionResult, Error, void>({
    mutationFn: () => deleteCommunityPostAction(postId),
    onSuccess: (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.postDeleteFailed);
        return;
      }

      toastAppSuccess(APP_MESSAGE_CODE.success.community.postDeleted);
      // 목록으로 이동했을 때 삭제된 글이 잠깐 보이지 않도록, 목록 캐시에서 먼저 즉시 제거 후 재검증.
      // postsAll()은 모든 크리에이터/페이지 캐시를 매치하므로, 삭제 대상 글이 실제로 들어있는 캐시만 보정한다.
      queryClient.setQueriesData<CommunityPostsResult>(
        { queryKey: QUERY_KEYS.community.postsAll() },
        (data) =>
          data && data.items.some((post) => post.id === postId)
            ? {
                ...data,
                items: data.items.filter((post) => post.id !== postId),
                totalCount: Math.max(0, data.totalCount - 1),
              }
            : data,
      );
      queryClient.removeQueries({ queryKey: QUERY_KEYS.community.post(postId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.postsAll() });
    },
    onError: (error) => {
      console.error("커뮤니티 게시글 삭제 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.community.postDeleteFailed);
    },
  });
}
