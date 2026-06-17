// 공용 TanStack Query key factory가 도메인별 캐시 경계를 유지하는지 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { QUERY_KEYS } from "./query-keys.ts";

test("live subscription badge assets query key is creator scoped", () => {
  assert.deepEqual(QUERY_KEYS.live.subscriptionBadgeAssets("creator-id"), [
    "live",
    "subscription-badge-assets",
    "creator-id",
  ]);
});
