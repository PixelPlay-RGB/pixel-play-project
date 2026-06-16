// 라이브 크리에이터 구독 Toss 결제 주문 값을 생성하고 검증합니다.

export const CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT = 4900;

export interface TossCreatorSubscriptionPrepareResponse {
  orderId: string;
  orderName: string;
  amount: number;
  customerKey: string;
}

export function createCreatorSubscriptionOrderId(nowMillis: number, uuid: string) {
  return `sub${Math.trunc(nowMillis)}${uuid.replaceAll("-", "").slice(0, 16)}`;
}

export function createCreatorSubscriptionOrderName(creatorName: string) {
  const displayName = creatorName.trim() || "채널";

  return `${displayName} 채널 월 구독 ${CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT.toLocaleString("ko-KR")}원`;
}

export function isCreatorSubscriptionPaymentAmount(value: unknown): value is number {
  return value === CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT;
}

export function isTossCreatorSubscriptionPrepareResponse(
  value: unknown,
): value is TossCreatorSubscriptionPrepareResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const response = value as Partial<TossCreatorSubscriptionPrepareResponse>;

  return (
    typeof response.orderId === "string" &&
    response.orderId.trim().length > 0 &&
    typeof response.orderName === "string" &&
    response.orderName.trim().length > 0 &&
    isCreatorSubscriptionPaymentAmount(response.amount) &&
    typeof response.customerKey === "string" &&
    response.customerKey.trim().length > 0
  );
}
