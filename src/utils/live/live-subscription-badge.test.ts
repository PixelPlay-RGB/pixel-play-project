// 라이브 구독 뱃지의 방송인별 storage 경로 생성을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getLiveSubscriptionBadgePublicUrl,
  normalizeLiveSubscriptionBadgeMonth,
} from "./live-subscription-badge.ts";

const CREATOR_ID = "89dac974-c64f-431f-b593-dd71882c0d33";

test("normalizeLiveSubscriptionBadgeMonth clamps subscription months to the available badge range", () => {
  assert.equal(normalizeLiveSubscriptionBadgeMonth(null), 1);
  assert.equal(normalizeLiveSubscriptionBadgeMonth(0), 1);
  assert.equal(normalizeLiveSubscriptionBadgeMonth(4.8), 4);
  assert.equal(normalizeLiveSubscriptionBadgeMonth(99), 12);
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
