"use client";
// 댓글 삭제 mutation(하드 딜리트). 낙관적 제거 후 재동기화합니다.

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { deleteCommunityCommentAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type { CommunityCommentsResult, CommunityPostDetail } from "@/types/community/community";
import { applyCommentCountDelta, removeComment } from "@/utils/community/community-cache";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

interface DeleteCommentContext {
  commentSnapshots: Array<[QueryKey, CommunityCommentsResult | undefined]>;
  detailSnapshot: CommunityPostDetail | undefined;
}

export function useDeleteCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  const commentsKey = QUERY_KEYS.community.commentsAll();
  const detailKey = QUERY_KEYS.community.post(postId);

  const restore = (context: DeleteCommentContext | undefined) => {
    if (!context) return;
    context.commentSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    queryClient.setQueryData(detailKey, context.detailSnapshot);
  };

  return useMutation<AppActionResult, Error, string, DeleteCommentContext>({
    mutationFn: (commentId) => deleteCommunityCommentAction(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const commentSnapshots = queryClient.getQueriesData<CommunityCommentsResult>({
        queryKey: commentsKey,
      });
      const detailSnapshot = queryClient.getQueryData<CommunityPostDetail>(detailKey);

      queryClient.setQueriesData<CommunityCommentsResult>({ queryKey: commentsKey }, (data) =>
        removeComment(data, commentId),
      );
      queryClient.setQueryData<CommunityPostDetail>(detailKey, (data) =>
        applyCommentCountDelta(data, postId, -1),
      );

      return { commentSnapshots, detailSnapshot };
    },
    onSuccess: (result, _commentId, context) => {
      if (!result.success) {
        restore(context);
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.commentDeleteFailed);
        return;
      }

      toastAppSuccess(APP_MESSAGE_CODE.success.community.commentDeleted);
    },
    onError: (error, _commentId, context) => {
      console.error("커뮤니티 댓글 삭제 실패", error);
      restore(context);
      toastAppError(APP_MESSAGE_CODE.error.community.commentDeleteFailed);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.commentsAll() });
      void queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}
