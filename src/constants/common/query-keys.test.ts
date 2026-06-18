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

test("subscribed channel emoji query key is viewer scoped", () => {
  assert.deepEqual(QUERY_KEYS.channel.subscribedEmojis("viewer-id"), [
    "channel",
    "subscribed-emojis",
    "viewer-id",
  ]);
});

test("channel emoji by ids query key is token scoped", () => {
  assert.deepEqual(QUERY_KEYS.channel.emojiByIds(["emoji-b", "emoji-a"]), [
    "channel",
    "emoji-by-ids",
    "emoji-b",
    "emoji-a",
  ]);
});
