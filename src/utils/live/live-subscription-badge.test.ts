// 라이브 구독 뱃지의 방송인별 storage 경로 생성을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildLiveSubscriptionBadgeMonths,
  getLiveDefaultSubscriptionBadgeSrc,
  getLiveSubscriptionBadgePublicUrl,
  readLiveSubscriptionBadgeAssetInfo,
  resolveLiveSubscriptionBadgeMonth,
} from "./live-subscription-badge.ts";

const CREATOR_ID = "89dac974-c64f-431f-b593-dd71882c0d33";

test("resolveLiveSubscriptionBadgeMonth picks the nearest configured month at or below total months", () => {
  assert.equal(resolveLiveSubscriptionBadgeMonth(null), 1);
  assert.equal(resolveLiveSubscriptionBadgeMonth(0), 1);
  assert.equal(resolveLiveSubscriptionBadgeMonth(4.8), 3);
  assert.equal(resolveLiveSubscriptionBadgeMonth(17), 12);
  assert.equal(resolveLiveSubscriptionBadgeMonth(18), 18);
  assert.equal(resolveLiveSubscriptionBadgeMonth(25, [24, 36]), 24);
  assert.equal(resolveLiveSubscriptionBadgeMonth(121, [24, 120]), 120);
});

test("buildLiveSubscriptionBadgeMonths keeps fixed months and valid custom months only", () => {
  assert.deepEqual(
    buildLiveSubscriptionBadgeMonths([18, 24, 120, 121, 2, 36]),
    [1, 2, 3, 6, 9, 12, 18, 24, 36, 120],
  );
});

test("getLiveSubscriptionBadgePublicUrl builds the creator scoped storage URL", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

  try {
    assert.equal(
      getLiveSubscriptionBadgePublicUrl(CREATOR_ID, 3),
      "https://example.supabase.co/storage/v1/object/public/user-media/89dac974-c64f-431f-b593-dd71882c0d33/subscription/3.png",
    );
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  }
});

test("getLiveSubscriptionBadgePublicUrl appends the badge version for cache busting", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

  try {
    assert.equal(
      getLiveSubscriptionBadgePublicUrl(CREATOR_ID, 3, [], "2026-06-15T12:34:56.789Z"),
      "https://example.supabase.co/storage/v1/object/public/user-media/89dac974-c64f-431f-b593-dd71882c0d33/subscription/3.png?v=2026-06-15T12%3A34%3A56.789Z",
    );
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  }
});

test("readLiveSubscriptionBadgeAssetInfo keeps custom months and newest storage timestamp", () => {
  assert.deepEqual(
    readLiveSubscriptionBadgeAssetInfo([
      { name: "1.png", updated_at: "2026-06-15T01:00:00.000Z" },
      { name: "24.png", updated_at: "2026-06-15T02:00:00.000Z" },
      { name: ".version", updated_at: "2026-06-15T03:00:00.000Z" },
      { name: "ignore.txt", updated_at: "2026-06-15T04:00:00.000Z" },
    ]),
    {
      customMonths: [24],
      version: "2026-06-15T03:00:00.000Z",
    },
  );
});

test("getLiveDefaultSubscriptionBadgeSrc builds the bundled fallback badge URL", () => {
  assert.equal(getLiveDefaultSubscriptionBadgeSrc(3), "/subscription-badges/3.png");
  assert.equal(getLiveDefaultSubscriptionBadgeSrc(99), "/subscription-badges/12.png");
});
