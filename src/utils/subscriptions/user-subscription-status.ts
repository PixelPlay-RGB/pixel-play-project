// 사용자 구독 상태를 혜택 유지와 재구독 가능 여부로 해석합니다.

import type { CreatorSubscriptionStatus } from "@/types/live/live";

interface SubscriptionBenefitInput {
  status: CreatorSubscriptionStatus;
  endAt: string;
}

interface SubscriptionStartInput {
  isSubscribed: boolean;
  status: CreatorSubscriptionStatus | null;
}

export function isSubscriptionBenefitActive(
  subscription: SubscriptionBenefitInput,
  now: Date = new Date(),
) {
  const endAtMs = Date.parse(subscription.endAt);

  return (
    (subscription.status === "active" || subscription.status === "canceled") &&
    Number.isFinite(endAtMs) &&
    endAtMs > now.getTime()
  );
}

export function canStartCreatorSubscription({ isSubscribed, status }: SubscriptionStartInput) {
  return !isSubscribed || status === "canceled";
}
