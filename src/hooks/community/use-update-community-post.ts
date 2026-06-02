"use client";
// 게시글 수정 mutation. 성공 시 상세·목록 캐시를 무효화합니다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCommunityPostAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export function useUpdateCommunityPost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation<AppActionResult, Error, string>({
    mutationFn: (content) => updateCommunityPostAction(postId, content),
    onSuccess: (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.postUpdateFailed);
        return;
      }

      toastAppSuccess(APP_MESSAGE_CODE.success.community.postUpdated);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.post(postId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.postsAll() });
    },
    onError: (error) => {
      console.error("커뮤니티 게시글 수정 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.community.postUpdateFailed);
    },
  });
}
