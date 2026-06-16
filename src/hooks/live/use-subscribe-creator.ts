"use client";
// 라이브 시청 페이지에서 크리에이터 구독 서버 액션을 호출합니다.

import { useState } from "react";
import { subscribeCreatorAction } from "@/actions/live/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import type { CreatorSubscriptionActionResult } from "@/types/live/live";

export function useSubscribeCreator(
  creatorId: string,
  canSubscribe: boolean,
  onSuccess: (result: CreatorSubscriptionActionResult) => void,
) {
  const [isPending, setIsPending] = useState(false);

  async function subscribe() {
    if (isPending || !canSubscribe) return;
    setIsPending(true);

    try {
      const result = await subscribeCreatorAction({ creatorId });

      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.live.subscriptionFailed);
        return;
      }

      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.live.subscribed);
      onSuccess(result.data);
    } catch (error) {
      console.error("라이브 구독 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.live.subscriptionFailed);
    } finally {
      setIsPending(false);
    }
  }

  return { subscribe, isPending };
}
