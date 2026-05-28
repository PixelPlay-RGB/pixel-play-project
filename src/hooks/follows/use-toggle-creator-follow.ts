"use client";
// 검색 결과에서 크리에이터 팔로우 상태를 토글합니다.
import { followCreatorAction, unfollowCreatorAction } from "@/actions/follows/follow";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type { LiveSearchResult } from "@/types/search/search";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";

interface ToggleCreatorFollowInput {
  creatorId: string;
  creatorNickname: string;
  nextFollowing: boolean;
}

type LiveSearchInfiniteData = InfiniteData<LiveSearchResult[]>;
type LiveSearchSnapshot = Array<[QueryKey, LiveSearchInfiniteData | undefined]>;

interface ToggleCreatorFollowContext {
  snapshot: LiveSearchSnapshot;
}

function updateLiveSearchFollowState(
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

export function useToggleCreatorFollow() {
  const queryClient = useQueryClient();

  return useMutation<AppActionResult, Error, ToggleCreatorFollowInput, ToggleCreatorFollowContext>({
    mutationFn: ({ creatorId, nextFollowing }) =>
      nextFollowing ? followCreatorAction({ creatorId }) : unfollowCreatorAction({ creatorId }),
    onMutate: async ({ creatorId, nextFollowing }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.live.all });

      const snapshot = queryClient.getQueriesData<LiveSearchInfiniteData>({
        queryKey: QUERY_KEYS.live.all,
      });

      queryClient.setQueriesData<LiveSearchInfiniteData>(
        { queryKey: QUERY_KEYS.live.all },
        (data) => updateLiveSearchFollowState(data, creatorId, nextFollowing),
      );

      return { snapshot };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        context.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
        toastAppError(
          result.code ??
            (variables.nextFollowing
              ? APP_MESSAGE_CODE.error.follow.failed
              : APP_MESSAGE_CODE.error.follow.unfollowFailed),
        );
        return;
      }

      toastAppSuccess(
        result.code ??
          (variables.nextFollowing
            ? APP_MESSAGE_CODE.success.follow.followed
            : APP_MESSAGE_CODE.success.follow.unfollowed),
        variables.nextFollowing
          ? `${variables.creatorNickname}님을 팔로우했습니다.`
          : `${variables.creatorNickname}님 팔로우를 해제했습니다.`,
      );
    },
    onError: (error, variables, context) => {
      console.error("크리에이터 팔로우 상태 변경 실패", error);
      context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      toastAppError(
        variables.nextFollowing
          ? APP_MESSAGE_CODE.error.follow.failed
          : APP_MESSAGE_CODE.error.follow.unfollowFailed,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.live.all });
    },
  });
}
