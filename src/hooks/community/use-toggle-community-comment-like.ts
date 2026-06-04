"use client";
// 댓글/대댓글 좋아요를 낙관적으로 토글합니다. 목록·베스트·대댓글 캐시를 함께 갱신합니다.

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";

import { setCommunityCommentLikeAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type {
  CommunityCommentRepliesResult,
  CommunityCommentsResult,
  CommunityPostLikeResult,
} from "@/types/community/community";
import { applyCommentLike, applyLikeToCommentList } from "@/utils/community/community-cache";
import { toastAppError } from "@/utils/common/toast-message";

interface ToggleCommentLikeInput {
  commentId: string;
  currentLiked: boolean;
  currentLikeCount: number;
}

interface ToggleCommentLikeContext {
  commentsSnapshots: Array<[QueryKey, CommunityCommentsResult | undefined]>;
  repliesSnapshots: Array<[QueryKey, InfiniteData<CommunityCommentRepliesResult> | undefined]>;
}

export function useToggleCommunityCommentLike() {
  const queryClient = useQueryClient();
  const commentsKey = QUERY_KEYS.community.commentsAll();
  const repliesKey = QUERY_KEYS.community.commentRepliesAll();

  const restore = (context: ToggleCommentLikeContext | undefined) => {
    if (!context) return;
    context.commentsSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    context.repliesSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
  };

  const writeLike = (commentId: string, next: { liked: boolean; likeCount: number }) => {
    queryClient.setQueriesData<CommunityCommentsResult>({ queryKey: commentsKey }, (data) =>
      applyCommentLike(data, commentId, next),
    );
    queryClient.setQueriesData<InfiniteData<CommunityCommentRepliesResult>>(
      { queryKey: repliesKey },
      (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: applyLikeToCommentList(page.items, commentId, next),
              })),
            }
          : data,
    );
  };

  return useMutation<
    AppActionResult<CommunityPostLikeResult>,
    Error,
    ToggleCommentLikeInput,
    ToggleCommentLikeContext
  >({
    mutationFn: ({ commentId, currentLiked }) =>
      setCommunityCommentLikeAction(commentId, !currentLiked),
    onMutate: async ({ commentId, currentLiked, currentLikeCount }) => {
      const next = {
        liked: !currentLiked,
        likeCount: Math.max(0, currentLikeCount + (currentLiked ? -1 : 1)),
      };

      await queryClient.cancelQueries({ queryKey: commentsKey });
      await queryClient.cancelQueries({ queryKey: repliesKey });

      const commentsSnapshots = queryClient.getQueriesData<CommunityCommentsResult>({
        queryKey: commentsKey,
      });
      const repliesSnapshots = queryClient.getQueriesData<
        InfiniteData<CommunityCommentRepliesResult>
      >({
        queryKey: repliesKey,
      });

      writeLike(commentId, next);

      return { commentsSnapshots, repliesSnapshots };
    },
    onSuccess: (result, { commentId }, context) => {
      if (!result.success || !result.data) {
        restore(context);
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.likeFailed);
        return;
      }

      writeLike(commentId, result.data);
    },
    onError: (error, _input, context) => {
      console.error("커뮤니티 댓글 좋아요 토글 실패", error);
      restore(context);
      toastAppError(APP_MESSAGE_CODE.error.community.likeFailed);
    },
  });
}
