"use client";

import { useState } from "react";
import { followCreatorAction, unfollowCreatorAction } from "@/actions/follows/follow";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

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
        toastAppSuccess(isFollowing ? APP_MESSAGE_CODE.success.live.unfollowed : APP_MESSAGE_CODE.success.live.followed);
        onSuccess();
      }
    } finally {
      setIsPending(false);
    }
  }

  return { toggleFollow, isPending };
}
