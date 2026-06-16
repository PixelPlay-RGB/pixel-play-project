// 사용자 구독 상태가 혜택 유지와 재구독 가능 여부로 해석되는 방식을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canStartCreatorSubscription,
  isSubscriptionBenefitActive,
} from "./user-subscription-status.ts";

const NOW = new Date("2026-06-17T00:00:00.000Z");
const FUTURE_END_AT = "2026-07-17T00:00:00.000Z";
const PAST_END_AT = "2026-06-16T00:00:00.000Z";

test("isSubscriptionBenefitActive keeps canceled subscriptions active until end_at", () => {
  assert.equal(isSubscriptionBenefitActive({ status: "active", endAt: FUTURE_END_AT }, NOW), true);
  assert.equal(
    isSubscriptionBenefitActive({ status: "canceled", endAt: FUTURE_END_AT }, NOW),
    true,
  );
  assert.equal(isSubscriptionBenefitActive({ status: "canceled", endAt: PAST_END_AT }, NOW), false);
});

test("canStartCreatorSubscription allows reactivation for canceled subscriptions", () => {
  assert.equal(canStartCreatorSubscription({ isSubscribed: true, status: "active" }), false);
  assert.equal(canStartCreatorSubscription({ isSubscribed: true, status: "canceled" }), true);
  assert.equal(canStartCreatorSubscription({ isSubscribed: false, status: "expired" }), true);
});
