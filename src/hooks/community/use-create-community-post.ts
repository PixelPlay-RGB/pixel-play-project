"use client";
// 게시글 작성 mutation. 성공 시 목록 캐시를 무효화합니다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCommunityPostAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export interface CreateCommunityPostPayload {
  content: string;
  image: File | null;
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation<AppActionResult<{ postId: string }>, Error, CreateCommunityPostPayload>({
    mutationFn: ({ content, image }) => {
      const formData = new FormData();
      formData.append("content", content);
      if (image) formData.append("image", image);
      return createCommunityPostAction(formData);
    },
    onSuccess: (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.postCreateFailed);
        return;
      }

      toastAppSuccess(APP_MESSAGE_CODE.success.community.postCreated);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.postsAll() });
    },
    onError: (error) => {
      console.error("커뮤니티 게시글 작성 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.community.postCreateFailed);
    },
  });
}
