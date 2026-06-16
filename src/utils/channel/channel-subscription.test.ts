// 채널 구독자 관리 목록의 검색·정렬·활성 카운트 계산을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildChannelSubscriptionSnapshot,
  filterAndSortChannelSubscribers,
  getActiveChannelSubscriberCount,
  getMonthlyNewChannelSubscriberCount,
  type ChannelSubscriberItem,
} from "./channel-subscription.ts";

const NOW = new Date("2026-06-15T00:00:00.000Z");

const SUBSCRIBERS = [
  {
    id: "sub-1",
    subscriberId: "user-1",
    nickname: "Anna",
    startedAt: "2026-01-01T00:00:00.000Z",
    endAt: "2026-07-01T00:00:00.000Z",
    totalMonths: 6,
    status: "active",
  },
  {
    id: "sub-2",
    subscriberId: "user-2",
    nickname: "주영",
    startedAt: "2026-06-01T00:00:00.000Z",
    endAt: "2026-07-01T00:00:00.000Z",
    totalMonths: 1,
    status: "active",
  },
  {
    id: "sub-3",
    subscriberId: "user-3",
    nickname: "Mina",
    startedAt: "2025-10-01T00:00:00.000Z",
    endAt: "2026-05-01T00:00:00.000Z",
    totalMonths: 8,
    status: "expired",
  },
  {
    id: "sub-4",
    subscriberId: "user-4",
    nickname: "Alex",
    startedAt: "2026-02-01T00:00:00.000Z",
    endAt: "2026-05-01T00:00:00.000Z",
    totalMonths: 3,
    status: "active",
  },
  {
    id: "sub-5",
    subscriberId: "user-5",
    nickname: "해지예약",
    startedAt: "2026-06-01T00:00:00.000Z",
    endAt: "2026-07-01T00:00:00.000Z",
    totalMonths: 2,
    status: "canceled",
  },
] satisfies ChannelSubscriberItem[];

test("getActiveChannelSubscriberCount counts subscriptions with benefits until end_at", () => {
  assert.equal(getActiveChannelSubscriberCount(SUBSCRIBERS, NOW), 3);
});

test("getMonthlyNewChannelSubscriberCount counts active subscriptions started this month", () => {
  assert.equal(getMonthlyNewChannelSubscriberCount(SUBSCRIBERS, NOW), 2);
});

test("filterAndSortChannelSubscribers filters by nickname", () => {
  const result = filterAndSortChannelSubscribers(SUBSCRIBERS, {
    query: "주",
    sort: "started_desc",
  });

  assert.deepEqual(
    result.map((item) => item.id),
    ["sub-2"],
  );
});

test("filterAndSortChannelSubscribers sorts without mutating the source list", () => {
  const result = filterAndSortChannelSubscribers(SUBSCRIBERS, {
    query: "",
    sort: "months_desc",
  });

  assert.deepEqual(
    result.map((item) => item.id),
    ["sub-3", "sub-1", "sub-4", "sub-5", "sub-2"],
  );
  assert.deepEqual(
    SUBSCRIBERS.map((item) => item.id),
    ["sub-1", "sub-2", "sub-3", "sub-4", "sub-5"],
  );
});

test("buildChannelSubscriptionSnapshot keeps subscription badge image cache data", () => {
  const snapshot = buildChannelSubscriptionSnapshot([], NOW, {
    creatorId: "creator-1",
    customBadgeMonths: [24],
    subscriptionBadgeVersion: "2026-06-15T03:00:00.000Z",
    subscriptionBadgeImageSources: {
      1: "/subscription-badges/1.png",
      2: "https://example.supabase.co/storage/v1/object/public/user-media/creator-1/subscription/2.png",
    },
  });

  assert.equal(snapshot.subscriptionBadgeVersion, "2026-06-15T03:00:00.000Z");
  assert.equal(snapshot.monthlyNewCount, 0);
  assert.deepEqual(snapshot.subscriptionBadgeImageSources, {
    1: "/subscription-badges/1.png",
    2: "https://example.supabase.co/storage/v1/object/public/user-media/creator-1/subscription/2.png",
  });
});
