"use client";
// 라이브 검색 결과에서 크리에이터 팔로잉 상태를 토글합니다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { followCreatorAction, unfollowCreatorAction } from "@/actions/following/following";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type {
  LiveSearchInfiniteData,
  ToggleLiveSearchFollowingContext,
  ToggleLiveSearchFollowingInput,
} from "@/types/following/live-search-following";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

function updateLiveSearchFollowingState(
  data: LiveSearchInfiniteData | undefined,
  creatorId: string,
  nextFollowing: boolean,
): LiveSearchInfiniteData | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) =>
      page.map((item) => {
        if (item.creator_id !== creatorId) {
          return item;
        }

        const followerDelta = item.is_following === nextFollowing ? 0 : nextFollowing ? 1 : -1;

        return {
          ...item,
          follower_count: Math.max(0, item.follower_count + followerDelta),
          is_following: nextFollowing,
        };
      }),
    ),
  };
}

export function useToggleLiveSearchFollowing() {
  const queryClient = useQueryClient();
  const liveSearchQueryKey = QUERY_KEYS.live.searchAll();

  return useMutation<
    AppActionResult,
    Error,
    ToggleLiveSearchFollowingInput,
    ToggleLiveSearchFollowingContext
  >({
    mutationFn: ({ creatorId, nextFollowing }) =>
      nextFollowing ? followCreatorAction({ creatorId }) : unfollowCreatorAction({ creatorId }),
    onMutate: async ({ creatorId, nextFollowing }) => {
      await queryClient.cancelQueries({ queryKey: liveSearchQueryKey });

      const snapshot = queryClient.getQueriesData<LiveSearchInfiniteData>({
        queryKey: liveSearchQueryKey,
      });

      queryClient.setQueriesData<LiveSearchInfiniteData>({ queryKey: liveSearchQueryKey }, (data) =>
        updateLiveSearchFollowingState(data, creatorId, nextFollowing),
      );

      return { snapshot };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        context.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
        toastAppError(
          result.code ??
            (variables.nextFollowing
              ? APP_MESSAGE_CODE.error.following.failed
              : APP_MESSAGE_CODE.error.following.unfollowFailed),
        );
        return;
      }

      toastAppSuccess(
        result.code ??
          (variables.nextFollowing
            ? APP_MESSAGE_CODE.success.following.followed
            : APP_MESSAGE_CODE.success.following.unfollowed),
      );
    },
    onError: (error, variables, context) => {
      console.error("크리에이터 팔로잉 상태 변경 실패", error);
      context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      toastAppError(
        variables.nextFollowing
          ? APP_MESSAGE_CODE.error.following.failed
          : APP_MESSAGE_CODE.error.following.unfollowFailed,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: liveSearchQueryKey });
    },
  });
}
