"use client";
// 팔로우·언팔로우 토글 훅입니다. pending 상태와 에러 토스트를 포함합니다.

import { useState } from "react";
import { followCreatorAction, unfollowCreatorAction } from "@/actions/follows/follow";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError } from "@/utils/common/toast-message";

export function useFollowCreator(
  creatorId: string,
  isFollowing: boolean,
  onSuccess: () => void,
) {
  const [isPending, setIsPending] = useState(false);

  async function toggleFollow() {
    if (isPending) return;
    setIsPending(true);
    try {
      const result = isFollowing
        ? await unfollowCreatorAction(creatorId)
        : await followCreatorAction(creatorId);

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
      } else {
        onSuccess();
      }
    } finally {
      setIsPending(false);
    }
  }

  return { toggleFollow, isPending };
}
