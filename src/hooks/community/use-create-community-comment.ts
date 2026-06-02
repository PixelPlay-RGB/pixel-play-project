"use client";
// 댓글 작성 mutation. 첫 페이지에 낙관적 삽입 후 서버 데이터로 재동기화합니다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCommunityCommentAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type { CommunityCommentsResult, CommunityPostDetail } from "@/types/community/community";
import { useNullableUser } from "@/hooks/profile/use-profile";
import {
  applyCommentCountDelta,
  createOptimisticComment,
  prependComment,
} from "@/utils/community/community-cache";
import { toastAppError } from "@/utils/common/toast-message";

interface CreateCommentContext {
  commentsSnapshot: CommunityCommentsResult | undefined;
  detailSnapshot: CommunityPostDetail | undefined;
}

export function useCreateCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useNullableUser();

  const firstPageKey = QUERY_KEYS.community.comments(postId, 1);
  const detailKey = QUERY_KEYS.community.post(postId);

  const restore = (context: CreateCommentContext | undefined) => {
    if (!context) return;
    queryClient.setQueryData(firstPageKey, context.commentsSnapshot);
    queryClient.setQueryData(detailKey, context.detailSnapshot);
  };

  return useMutation<AppActionResult<{ commentId: string }>, Error, string, CreateCommentContext>({
    mutationFn: (content) => createCommunityCommentAction(postId, content),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.community.commentsAll() });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const commentsSnapshot = queryClient.getQueryData<CommunityCommentsResult>(firstPageKey);
      const detailSnapshot = queryClient.getQueryData<CommunityPostDetail>(detailKey);

      if (currentUser) {
        const optimistic = createOptimisticComment({
          id: `optimistic-${crypto.randomUUID()}`,
          authorId: currentUser.id,
          authorNickname: currentUser.nickname,
          authorPhotoUrl: currentUser.photo_url,
          content,
          createdAt: new Date().toISOString(),
        });

        queryClient.setQueryData<CommunityCommentsResult>(firstPageKey, (data) =>
          prependComment(data, optimistic),
        );
      }

      queryClient.setQueryData<CommunityPostDetail>(detailKey, (data) =>
        applyCommentCountDelta(data, postId, 1),
      );

      return { commentsSnapshot, detailSnapshot };
    },
    onSuccess: (result, _content, context) => {
      if (!result.success) {
        restore(context);
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.commentCreateFailed);
      }
    },
    onError: (error, _content, context) => {
      console.error("커뮤니티 댓글 작성 실패", error);
      restore(context);
      toastAppError(APP_MESSAGE_CODE.error.community.commentCreateFailed);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.commentsAll() });
      void queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}
