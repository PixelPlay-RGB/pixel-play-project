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

interface LiveSubscriptionButtonActionInput extends SubscriptionStartInput {
  isPending: boolean;
}

export type LiveSubscriptionButtonAction =
  | "open_subscribe_dialog"
  | "open_cancel_dialog"
  | "disabled";

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

export function getLiveSubscriptionButtonAction({
  isSubscribed,
  status,
  isPending,
}: LiveSubscriptionButtonActionInput): LiveSubscriptionButtonAction {
  if (isPending) {
    return "disabled";
  }

  if (isSubscribed && status === "active") {
    return "open_cancel_dialog";
  }

  if (canStartCreatorSubscription({ isSubscribed, status })) {
    return "open_subscribe_dialog";
  }

  return "disabled";
}
