"use client";
// 크리에이터 팔로잉 상태 변경과 라이브 캐시 갱신을 관리합니다.

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { followCreatorAction, unfollowCreatorAction } from "@/actions/following/following";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type { LiveListSnapshot } from "@/types/live/live";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

interface ToggleCreatorFollowingInput {
  creatorId: string;
  nextFollowing: boolean;
}

type LiveListSnapshotCache = Array<[QueryKey, LiveListSnapshot | undefined]>;

interface ToggleCreatorFollowingContext {
  snapshot: LiveListSnapshotCache;
}

function updateLiveListFollowingState(
  data: LiveListSnapshot | undefined,
  creatorId: string,
  nextFollowing: boolean,
): LiveListSnapshot | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    items: data.items.map((item) =>
      item.creatorId === creatorId
        ? {
            ...item,
            isFollowing: nextFollowing,
          }
        : item,
    ),
  };
}

export function useToggleCreatorFollowing() {
  const queryClient = useQueryClient();
  const liveListQueryKey = QUERY_KEYS.live.listAll();

  return useMutation<
    AppActionResult,
    Error,
    ToggleCreatorFollowingInput,
    ToggleCreatorFollowingContext
  >({
    mutationFn: ({ creatorId, nextFollowing }) =>
      nextFollowing ? followCreatorAction({ creatorId }) : unfollowCreatorAction({ creatorId }),
    onMutate: async ({ creatorId, nextFollowing }) => {
      await queryClient.cancelQueries({ queryKey: liveListQueryKey });

      const snapshot = queryClient.getQueriesData<LiveListSnapshot>({
        queryKey: liveListQueryKey,
      });

      queryClient.setQueriesData<LiveListSnapshot>({ queryKey: liveListQueryKey }, (data) =>
        updateLiveListFollowingState(data, creatorId, nextFollowing),
      );

      return { snapshot };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
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
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.live.all });
      // 팔로잉 페이지 목록도 함께 갱신해 토글 결과가 즉시 반영되도록 합니다.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.following.all });
    },
  });
}
