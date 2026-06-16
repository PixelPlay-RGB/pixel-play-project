"use client";
// 라이브 시청 페이지의 구독 버튼 로그인 게이트와 구독 액션을 묶습니다.

import { useState } from "react";
import { cancelCreatorSubscriptionByCreatorAction } from "@/actions/user/subscription";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useSubscribeCreator } from "@/hooks/live/use-subscribe-creator";
import type { CreatorSubscriptionActionResult, CreatorSubscriptionStatus } from "@/types/live/live";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { canStartCreatorSubscription } from "@/utils/subscriptions/user-subscription-status";

interface Params {
  creatorId: string;
  isSubscribed: boolean;
  subscriptionStatus: CreatorSubscriptionStatus | null;
  isLoggedIn: boolean;
  onSubscribed: (result: CreatorSubscriptionActionResult) => void;
  onSubscriptionCanceled: () => void;
  onUnauthenticated: () => void;
}

export function useLiveSubscribeAction({
  creatorId,
  isSubscribed,
  subscriptionStatus,
  isLoggedIn,
  onSubscribed,
  onSubscriptionCanceled,
  onUnauthenticated,
}: Params) {
  const [isCancelPending, setIsCancelPending] = useState(false);
  const canSubscribe = canStartCreatorSubscription({
    isSubscribed,
    status: subscriptionStatus,
  });
  const { subscribe, isPending } = useSubscribeCreator(creatorId, canSubscribe, onSubscribed);
  const isSubscriptionActionPending = isPending || isCancelPending;

  function handleSubscribe() {
    if (!isLoggedIn) {
      onUnauthenticated();
      return;
    }

    void subscribe();
  }

  async function handleCancelSubscription() {
    if (!isLoggedIn) {
      onUnauthenticated();
      return;
    }

    if (isSubscriptionActionPending || !isSubscribed || subscriptionStatus !== "active") {
      return;
    }

    setIsCancelPending(true);

    try {
      const result = await cancelCreatorSubscriptionByCreatorAction(creatorId);

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.user.subscriptionCancelFailed);
        return;
      }

      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.user.subscriptionCanceled);
      onSubscriptionCanceled();
    } catch (error) {
      console.error("라이브 구독 해지 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.user.subscriptionCancelFailed);
    } finally {
      setIsCancelPending(false);
    }
  }

  return {
    handleSubscribe,
    handleCancelSubscription,
    isSubscribePending: isSubscriptionActionPending,
  };
}
