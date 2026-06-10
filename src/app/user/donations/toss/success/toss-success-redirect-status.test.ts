// Toss 성공 리다이렉트의 예외 처리 상태를 검증합니다.
import assert from "node:assert/strict";
import test from "node:test";

import { getTossSuccessRedirectPaymentStatus } from "./toss-success-redirect-status";

test("returns charge_failed when Toss confirm throws", async () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    const paymentStatus = await getTossSuccessRedirectPaymentStatus(async () => {
      throw new Error("confirm failed");
    });

    assert.equal(paymentStatus, "charge_failed");
  } finally {
    console.error = originalConsoleError;
  }
});

test("maps Toss confirm result success to payment status", async () => {
  assert.equal(
    await getTossSuccessRedirectPaymentStatus(async () => ({ success: true })),
    "charge_success",
  );
  assert.equal(
    await getTossSuccessRedirectPaymentStatus(async () => ({ success: false })),
    "charge_failed",
  );
});
