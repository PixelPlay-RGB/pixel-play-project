"use client";
// 공개 채널 헤더의 팔로우 토글 상태를 낙관적으로 관리합니다.
// (라이브 목록 캐시에 의존하는 use-toggle-creator-following과 달리 채널 헤더 자체 상태만 갱신)

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import {
  followToggleErrorCode,
  followToggleSuccessCode,
  runFollowToggleAction,
} from "@/hooks/following/follow-toggle-core";
import type { AppActionResult } from "@/types/common/action";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

interface UseToggleChannelFollowingParams {
  creatorId: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
}

interface FollowSnapshot {
  isFollowing: boolean;
  followerCount: number;
}

export function useToggleChannelFollowing({
  creatorId,
  initialIsFollowing,
  initialFollowerCount,
}: UseToggleChannelFollowingParams) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

  const mutation = useMutation<AppActionResult, Error, boolean, FollowSnapshot>({
    mutationFn: (nextFollowing) => runFollowToggleAction(creatorId, nextFollowing),
    onMutate: (nextFollowing) => {
      const snapshot: FollowSnapshot = { isFollowing, followerCount };

      setIsFollowing(nextFollowing);
      setFollowerCount((count) => Math.max(0, count + (nextFollowing ? 1 : -1)));

      return snapshot;
    },
    onSuccess: (result, nextFollowing, snapshot) => {
      if (!result.success) {
        if (snapshot) {
          setIsFollowing(snapshot.isFollowing);
          setFollowerCount(snapshot.followerCount);
        }
        toastAppError(result.code ?? followToggleErrorCode(nextFollowing));
        return;
      }

      toastAppSuccess(result.code ?? followToggleSuccessCode(nextFollowing));
    },
    onError: (error, nextFollowing, snapshot) => {
      console.error("채널 팔로잉 상태 변경 실패", error);
      if (snapshot) {
        setIsFollowing(snapshot.isFollowing);
        setFollowerCount(snapshot.followerCount);
      }
      toastAppError(followToggleErrorCode(nextFollowing));
    },
  });

  return {
    isFollowing,
    followerCount,
    isPending: mutation.isPending,
    toggle: () => {
      if (mutation.isPending) return;
      mutation.mutate(!isFollowing);
    },
  };
}
