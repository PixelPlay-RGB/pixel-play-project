"use client";
// 댓글 수정 mutation. 낙관적으로 본문/수정표시를 갱신 후 재동기화합니다.

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { updateCommunityCommentAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type { CommunityCommentsResult } from "@/types/community/community";
import { applyCommentContent } from "@/utils/community/community-cache";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

interface UpdateCommentInput {
  commentId: string;
  content: string;
}

interface UpdateCommentContext {
  snapshots: Array<[QueryKey, CommunityCommentsResult | undefined]>;
}

export function useUpdateCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  const commentsKey = QUERY_KEYS.community.commentsAll();

  return useMutation<AppActionResult, Error, UpdateCommentInput, UpdateCommentContext>({
    mutationFn: ({ commentId, content }) => updateCommunityCommentAction(commentId, content),
    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });

      const snapshots = queryClient.getQueriesData<CommunityCommentsResult>({
        queryKey: commentsKey,
      });
      const modifiedAt = new Date().toISOString();

      queryClient.setQueriesData<CommunityCommentsResult>({ queryKey: commentsKey }, (data) =>
        applyCommentContent(data, commentId, content, modifiedAt),
      );

      return { snapshots };
    },
    onSuccess: (result, _input, context) => {
      if (!result.success) {
        context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.commentUpdateFailed);
        return;
      }

      toastAppSuccess(APP_MESSAGE_CODE.success.community.commentUpdated);
    },
    onError: (error, _input, context) => {
      console.error("커뮤니티 댓글 수정 실패", error);
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toastAppError(APP_MESSAGE_CODE.error.community.commentUpdateFailed);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.commentsAll() });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.post(postId) });
    },
  });
}
