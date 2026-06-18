// 사용자 구독 관리 다이얼로그의 기본 액션 표시 정책을 제공합니다.

import type { CreatorSubscriptionStatus } from "@/types/live/live";

interface UserSubscriptionManagementActionInput {
  isActive: boolean;
  status: CreatorSubscriptionStatus;
  isPending?: boolean;
}

export function isUserSubscriptionRestartAction({
  isActive,
  status,
}: UserSubscriptionManagementActionInput) {
  return !isActive || status === "canceled";
}

export function getUserSubscriptionManagementPrimaryActionLabel({
  isActive,
  status,
  isPending = false,
}: UserSubscriptionManagementActionInput) {
  if (isActive && status === "active") {
    return isPending ? "구독 해지 중" : "구독 해지";
  }

  if (isPending) {
    return "구독 처리 중";
  }

  return "구독 다시 시작";
}
