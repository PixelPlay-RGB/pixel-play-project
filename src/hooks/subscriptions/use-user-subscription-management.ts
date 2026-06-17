"use client";
// 사용자 구독 관리 다이얼로그의 해지와 재구독 액션 상태를 관리합니다.

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { subscribeCreatorAction } from "@/actions/live/live";
import { cancelCreatorSubscriptionAction } from "@/actions/user/subscription";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { UserSubscriptionItem } from "@/types/subscriptions/user-subscriptions";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

interface UseUserSubscriptionManagementOptions {
  subscription: UserSubscriptionItem | null;
  canSubscribe: boolean;
  shouldCancel: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useUserSubscriptionManagement({
  subscription,
  canSubscribe,
  shouldCancel,
  onOpenChange,
}: UseUserSubscriptionManagementOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!subscription || isPending) return;

    startTransition(async () => {
      try {
        const result = await cancelCreatorSubscriptionAction(subscription.id);

        if (!result.success) {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.user.subscriptionCancelFailed);
          return;
        }

        toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.user.subscriptionCanceled);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("사용자 구독 해지 요청 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.user.subscriptionCancelFailed);
      }
    });
  }

  function handleSubscribe() {
    if (!subscription || isPending || !canSubscribe) return;

    startTransition(async () => {
      try {
        const result = await subscribeCreatorAction({ creatorId: subscription.creatorId });

        if (!result.success || !result.data) {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.live.subscriptionFailed);
          return;
        }

        toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.live.subscribed);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("사용자 구독 재시작 요청 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.live.subscriptionFailed);
      }
    });
  }

  function handlePrimaryAction() {
    if (shouldCancel) {
      handleCancel();
      return;
    }

    handleSubscribe();
  }

  return {
    isPending,
    handlePrimaryAction,
  };
}
