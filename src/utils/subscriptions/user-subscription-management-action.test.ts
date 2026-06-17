// 사용자 구독 관리 다이얼로그의 기본 액션 표시 정책을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getUserSubscriptionManagementPrimaryActionLabel,
  isUserSubscriptionRestartAction,
} from "./user-subscription-management-action.ts";

test("isUserSubscriptionRestartAction treats canceled active subscriptions as restartable", () => {
  assert.equal(isUserSubscriptionRestartAction({ isActive: true, status: "canceled" }), true);
  assert.equal(isUserSubscriptionRestartAction({ isActive: false, status: "expired" }), true);
  assert.equal(isUserSubscriptionRestartAction({ isActive: true, status: "active" }), false);
});

test("getUserSubscriptionManagementPrimaryActionLabel uses live restart wording", () => {
  assert.equal(
    getUserSubscriptionManagementPrimaryActionLabel({
      isActive: true,
      status: "canceled",
      isPending: false,
    }),
    "구독 다시 시작",
  );
  assert.equal(
    getUserSubscriptionManagementPrimaryActionLabel({
      isActive: false,
      status: "expired",
      isPending: false,
    }),
    "구독 다시 시작",
  );
});

test("getUserSubscriptionManagementPrimaryActionLabel keeps cancellation wording for active subscriptions", () => {
  assert.equal(
    getUserSubscriptionManagementPrimaryActionLabel({
      isActive: true,
      status: "active",
      isPending: false,
    }),
    "구독 해지",
  );
  assert.equal(
    getUserSubscriptionManagementPrimaryActionLabel({
      isActive: true,
      status: "active",
      isPending: true,
    }),
    "구독 해지 중",
  );
});
