// 라이브 구독 RPC 오류가 사용자 메시지 코드로 변환되는 방식을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { APP_MESSAGE_CODE } from "../../constants/common/app-message-code.ts";

import { resolveLiveSubscriptionRpcErrorCode } from "./live-subscription-rpc-error.ts";

test("resolveLiveSubscriptionRpcErrorCode maps insufficient wallet balance", () => {
  assert.equal(
    resolveLiveSubscriptionRpcErrorCode({ code: "PX402" }),
    APP_MESSAGE_CODE.error.live.subscriptionInsufficientBalance,
  );
});

test("resolveLiveSubscriptionRpcErrorCode keeps unknown errors on subscription failure", () => {
  assert.equal(
    resolveLiveSubscriptionRpcErrorCode({ code: "PX500" }),
    APP_MESSAGE_CODE.error.live.subscriptionFailed,
  );
});
