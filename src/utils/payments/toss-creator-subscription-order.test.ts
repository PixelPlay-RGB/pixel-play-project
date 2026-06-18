// 라이브 구독 Toss 결제 주문 유틸리티를 검증합니다.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT } from "../../constants/subscriptions/creator-subscription.ts";
import {
  createCreatorSubscriptionOrderId,
  createCreatorSubscriptionOrderName,
  isTossCreatorSubscriptionPrepareResponse,
} from "./toss-creator-subscription-order.ts";

describe("toss creator subscription order", () => {
  it("creates a stable Toss-safe subscription order id", () => {
    const orderId = createCreatorSubscriptionOrderId(
      1781650500000,
      "3b7c9b7e-e99a-4e1d-9c98-1892ef8f4d3d",
    );

    assert.equal(orderId, "sub17816505000003b7c9b7ee99a4e1d");
    assert.match(orderId, /^[A-Za-z0-9_-]+$/);
  });

  it("uses the fixed live subscription amount in the order name", () => {
    assert.equal(
      createCreatorSubscriptionOrderName("주영"),
      `주영 채널 월 구독 ${CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT.toLocaleString("ko-KR")}원`,
    );
  });

  it("validates a prepared Toss subscription payment response", () => {
    assert.equal(
      isTossCreatorSubscriptionPrepareResponse({
        orderId: "sub17816505000003b7c9b7ee99a4e1d",
        orderName: "주영 채널 월 구독 4,900원",
        amount: 4900,
        customerKey: "user_customer_key",
      }),
      true,
    );

    assert.equal(
      isTossCreatorSubscriptionPrepareResponse({
        orderId: "sub17816505000003b7c9b7ee99a4e1d",
        orderName: "주영 채널 월 구독 4,900원",
        amount: 5000,
        customerKey: "user_customer_key",
      }),
      false,
    );
  });
});
