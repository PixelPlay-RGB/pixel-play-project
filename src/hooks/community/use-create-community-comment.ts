"use client";
// 댓글/대댓글 작성 mutation. 성공 시 관련 캐시를 무효화합니다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCommunityCommentAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import { toastAppError } from "@/utils/common/toast-message";

interface CreateCommentInput {
  content: string;
  // 있으면 대댓글, 없으면 상위 댓글.
  parentId?: string;
}

export function useCreateCommunityComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation<AppActionResult<{ commentId: string }>, Error, CreateCommentInput>({
    mutationFn: ({ content, parentId }) => createCommunityCommentAction(postId, content, parentId),
    onSuccess: (result, variables) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.commentCreateFailed);
        return;
      }

      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.commentsAll() });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.post(postId) });

      if (variables.parentId) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.community.commentReplies(variables.parentId),
        });
      }
    },
    onError: (error) => {
      console.error("커뮤니티 댓글 작성 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.community.commentCreateFailed);
    },
  });
}
