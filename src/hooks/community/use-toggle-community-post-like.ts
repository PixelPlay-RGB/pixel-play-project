"use client";
// 게시글 좋아요(버프)를 낙관적으로 토글합니다. 상세·목록 캐시를 함께 갱신합니다.

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { toggleCommunityPostLikeAction } from "@/actions/community/community";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type {
  CommunityPostDetail,
  CommunityPostLikeResult,
  CommunityPostsResult,
} from "@/types/community/community";
import { applyLikeToPostDetail, applyLikeToPostsResult } from "@/utils/community/community-cache";
import { toastAppError } from "@/utils/common/toast-message";

interface ToggleLikeInput {
  currentLiked: boolean;
  currentLikeCount: number;
}

interface ToggleLikeContext {
  postSnapshot: CommunityPostDetail | undefined;
  listSnapshots: Array<[QueryKey, CommunityPostsResult | undefined]>;
}

export function useToggleCommunityPostLike(postId: string) {
  const queryClient = useQueryClient();
  const postKey = QUERY_KEYS.community.post(postId);
  const postsKey = QUERY_KEYS.community.postsAll();

  const restore = (context: ToggleLikeContext | undefined) => {
    if (!context) return;
    queryClient.setQueryData(postKey, context.postSnapshot);
    context.listSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
  };

  return useMutation<
    AppActionResult<CommunityPostLikeResult>,
    Error,
    ToggleLikeInput,
    ToggleLikeContext
  >({
    mutationFn: () => toggleCommunityPostLikeAction(postId),
    onMutate: async ({ currentLiked, currentLikeCount }) => {
      const next = {
        liked: !currentLiked,
        likeCount: Math.max(0, currentLikeCount + (currentLiked ? -1 : 1)),
      };

      await queryClient.cancelQueries({ queryKey: postKey });
      await queryClient.cancelQueries({ queryKey: postsKey });

      const postSnapshot = queryClient.getQueryData<CommunityPostDetail>(postKey);
      const listSnapshots = queryClient.getQueriesData<CommunityPostsResult>({ queryKey: postsKey });

      queryClient.setQueryData<CommunityPostDetail>(postKey, (data) =>
        applyLikeToPostDetail(data, postId, next),
      );
      queryClient.setQueriesData<CommunityPostsResult>({ queryKey: postsKey }, (data) =>
        applyLikeToPostsResult(data, postId, next),
      );

      return { postSnapshot, listSnapshots };
    },
    onSuccess: (result, _input, context) => {
      if (!result.success || !result.data) {
        restore(context);
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.community.likeFailed);
        return;
      }

      const confirmed = result.data;

      queryClient.setQueryData<CommunityPostDetail>(postKey, (data) =>
        applyLikeToPostDetail(data, postId, confirmed),
      );
      queryClient.setQueriesData<CommunityPostsResult>({ queryKey: postsKey }, (data) =>
        applyLikeToPostsResult(data, postId, confirmed),
      );
    },
    onError: (error, _input, context) => {
      console.error("커뮤니티 좋아요 토글 실패", error);
      restore(context);
      toastAppError(APP_MESSAGE_CODE.error.community.likeFailed);
    },
  });
}
