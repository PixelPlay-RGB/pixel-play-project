"use client";
// 라이브 시청 화면에서 크리에이터 팔로우/언팔로우 서버 액션을 호출합니다.

import { useState } from "react";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { followToggleErrorCode, runFollowToggleAction } from "@/hooks/following/follow-toggle-core";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export function useFollowCreator(creatorId: string, isFollowing: boolean, onSuccess: () => void) {
  const [isPending, setIsPending] = useState(false);

  async function toggleFollow() {
    if (isPending) return;
    setIsPending(true);
    try {
      // 시청 화면 토글은 nextFollowing = !isFollowing(현재 팔로우면 언팔로우).
      const result = await runFollowToggleAction(creatorId, !isFollowing);

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
      } else {
        toastAppSuccess(
          isFollowing
            ? APP_MESSAGE_CODE.success.following.unfollowed
            : APP_MESSAGE_CODE.success.following.followed,
        );
        onSuccess();
      }
    } catch (error) {
      console.error("라이브 팔로우 처리 실패", error);
      // nextFollowing = !isFollowing 기준의 실패 코드(팔로우 실패 / 언팔로우 실패).
      toastAppError(followToggleErrorCode(!isFollowing));
    } finally {
      setIsPending(false);
    }
  }

  return { toggleFollow, isPending };
}
