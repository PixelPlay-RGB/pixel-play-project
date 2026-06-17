// 공개 채널 프로필의 구독 상태 스냅샷 생성을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { createChannelProfileSubscriptionSnapshot } from "./channel-profile-subscription.ts";

const NOW = new Date("2026-06-17T00:00:00.000Z");
const FUTURE_END_AT = "2026-07-17T00:00:00.000Z";
const PAST_END_AT = "2026-06-16T00:00:00.000Z";

test("createChannelProfileSubscriptionSnapshot keeps canceled subscriptions subscribed until end_at", () => {
  const snapshot = createChannelProfileSubscriptionSnapshot({
    creatorId: "creator-1",
    subscription: {
      status: "canceled",
      end_at: FUTURE_END_AT,
    },
    badgeAssets: {
      customMonths: [24],
      availableMonths: [1, 24],
      version: "2026-06-17T00:00:00.000Z",
    },
    now: NOW,
  });

  assert.equal(snapshot.isSubscribed, true);
  assert.equal(snapshot.status, "canceled");
  assert.deepEqual(snapshot.customMonths, [24]);
  assert.equal(snapshot.version, "2026-06-17T00:00:00.000Z");
  assert.match(snapshot.imageSourcesByMonth[24], /creator-1\/subscription\/24\.png/);
});

test("createChannelProfileSubscriptionSnapshot treats expired rows as unsubscribed", () => {
  const snapshot = createChannelProfileSubscriptionSnapshot({
    creatorId: "creator-1",
    subscription: {
      status: "active",
      end_at: PAST_END_AT,
    },
    badgeAssets: {
      customMonths: [],
      availableMonths: [],
      version: null,
    },
    now: NOW,
  });

  assert.equal(snapshot.isSubscribed, false);
  assert.equal(snapshot.status, "active");
});

test("createChannelProfileSubscriptionSnapshot handles missing subscription rows", () => {
  const snapshot = createChannelProfileSubscriptionSnapshot({
    creatorId: "creator-1",
    subscription: null,
    badgeAssets: {
      customMonths: [],
      availableMonths: [],
      version: null,
    },
    now: NOW,
  });

  assert.equal(snapshot.isSubscribed, false);
  assert.equal(snapshot.status, null);
});
