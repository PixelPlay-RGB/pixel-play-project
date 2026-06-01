"use client";

import { useState } from "react";
import { followCreatorAction, unfollowCreatorAction } from "@/actions/following/following";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export function useFollowCreator(creatorId: string, isFollowing: boolean, onSuccess: () => void) {
  const [isPending, setIsPending] = useState(false);

  async function toggleFollow() {
    if (isPending) return;
    setIsPending(true);
    try {
      const result = isFollowing
        ? await unfollowCreatorAction({ creatorId })
        : await followCreatorAction({ creatorId });

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
      toastAppError(
        isFollowing
          ? APP_MESSAGE_CODE.error.following.unfollowFailed
          : APP_MESSAGE_CODE.error.following.failed,
      );
    } finally {
      setIsPending(false);
    }
  }

  return { toggleFollow, isPending };
}
