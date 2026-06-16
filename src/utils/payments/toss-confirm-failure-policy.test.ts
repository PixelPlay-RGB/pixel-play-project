// Toss 승인 실패 분류 정책을 검증합니다.
import assert from "node:assert/strict";
import test from "node:test";

import { shouldMarkTossConfirmFailed } from "./toss-confirm-failure-policy";

test("keeps retryable Toss confirm failures pending", () => {
  const retryableCases = [
    { status: 409, errorCode: "IDEMPOTENT_REQUEST_PROCESSING" },
    { status: 429, errorCode: "TOO_MANY_REQUESTS" },
    { status: 403, errorCode: "FORBIDDEN_CONSECUTIVE_REQUEST" },
    { status: 500, errorCode: "INTERNAL_SERVER_ERROR" },
    { status: 400, errorCode: "ALREADY_PROCESSED_PAYMENT" },
    { status: 400, errorCode: "PROVIDER_ERROR" },
  ];

  for (const retryableCase of retryableCases) {
    assert.equal(shouldMarkTossConfirmFailed(retryableCase), false);
  }
});

test("marks definitive Toss confirm failures as failed", () => {
  assert.equal(shouldMarkTossConfirmFailed({ status: 400, errorCode: "INVALID_REQUEST" }), true);
  assert.equal(shouldMarkTossConfirmFailed({ status: 403, errorCode: "FORBIDDEN_REQUEST" }), true);
});
