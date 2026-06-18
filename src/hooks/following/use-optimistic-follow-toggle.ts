"use client";
// 라이브 검색 결과·라이브 목록 캐시의 팔로잉 토글 공용 골격을 제공합니다.
// 옵티미스틱 setQueriesData → 실패/에러 시 스냅샷 롤백 → 성공/실패 토스트까지 두 곳이 같은 흐름을
// 쓰므로, 캐시 키와 캐시 업데이트(updater)·무효화(onSettled)만 주입받아 재사용합니다.

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from "@tanstack/react-query";

import {
  followToggleErrorCode,
  followToggleSuccessCode,
  runFollowToggleAction,
} from "@/hooks/following/follow-toggle-core";
import type { AppActionResult } from "@/types/common/action";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export interface OptimisticFollowToggleInput {
  creatorId: string;
  nextFollowing: boolean;
}

type OptimisticFollowSnapshot<TData> = Array<[QueryKey, TData | undefined]>;

interface OptimisticFollowToggleContext<TData> {
  snapshot: OptimisticFollowSnapshot<TData>;
}

interface UseOptimisticFollowToggleParams<TData> {
  // setQueriesData/getQueriesData/invalidate가 묶이는 캐시 키(부분 일치 키).
  queryKey: QueryKey;
  // 토글 대상 항목의 isFollowing(+파생 값)을 갱신해 새 캐시 데이터를 반환한다.
  updater: (
    data: TData | undefined,
    creatorId: string,
    nextFollowing: boolean,
  ) => TData | undefined;
  // settle 시 무효화할 키 목록. 미지정 시 queryKey 하나만 무효화한다.
  invalidateKeys?: QueryKey[];
}

export function useOptimisticFollowToggle<TData>({
  queryKey,
  updater,
  invalidateKeys,
}: UseOptimisticFollowToggleParams<TData>): UseMutationResult<
  AppActionResult,
  Error,
  OptimisticFollowToggleInput,
  OptimisticFollowToggleContext<TData>
> {
  const queryClient = useQueryClient();
  const keysToInvalidate = invalidateKeys ?? [queryKey];

  return useMutation<
    AppActionResult,
    Error,
    OptimisticFollowToggleInput,
    OptimisticFollowToggleContext<TData>
  >({
    mutationFn: ({ creatorId, nextFollowing }) => runFollowToggleAction(creatorId, nextFollowing),
    onMutate: async ({ creatorId, nextFollowing }) => {
      await queryClient.cancelQueries({ queryKey });

      const snapshot = queryClient.getQueriesData<TData>({ queryKey });

      queryClient.setQueriesData<TData>({ queryKey }, (data) =>
        updater(data, creatorId, nextFollowing),
      );

      return { snapshot };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
        toastAppError(result.code ?? followToggleErrorCode(variables.nextFollowing));
        return;
      }

      toastAppSuccess(result.code ?? followToggleSuccessCode(variables.nextFollowing));
    },
    onError: (error, variables, context) => {
      console.error("크리에이터 팔로잉 상태 변경 실패", error);
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toastAppError(followToggleErrorCode(variables.nextFollowing));
    },
    onSettled: () => {
      keysToInvalidate.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
