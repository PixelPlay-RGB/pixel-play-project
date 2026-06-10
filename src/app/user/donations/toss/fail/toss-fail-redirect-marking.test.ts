// Toss 실패 리다이렉트의 상태 마킹 예외 처리를 검증합니다.
import assert from "node:assert/strict";
import test from "node:test";

import { markTossFailureForRedirect } from "./toss-fail-redirect-marking";

test("swallows marking errors so the redirect flow can continue", async () => {
  const originalConsoleError = console.error;
  let markCallCount = 0;

  console.error = () => undefined;

  try {
    await assert.doesNotReject(
      markTossFailureForRedirect({
        orderId: "order-id",
        markFailure: async () => {
          markCallCount += 1;
          throw new Error("mark failed");
        },
      }),
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(markCallCount, 1);
});
