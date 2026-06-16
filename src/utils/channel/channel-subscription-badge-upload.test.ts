// 구독 배지 PNG 업로드 검증 유틸을 테스트합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE,
  getPngDimensions,
  isValidSubscriptionBadgePng,
} from "./channel-subscription-badge-upload.ts";

function makePngHeader(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x00, 0x00, 0x00, 0x0d], 8);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return bytes;
}

test("getPngDimensions reads width and height from a PNG IHDR header", () => {
  assert.deepEqual(getPngDimensions(makePngHeader(60, 60)), { width: 60, height: 60 });
});

test("getPngDimensions rejects non PNG bytes", () => {
  assert.equal(getPngDimensions(new Uint8Array([1, 2, 3, 4])), null);
});

test("isValidSubscriptionBadgePng accepts only the configured square size", () => {
  assert.equal(
    isValidSubscriptionBadgePng(
      makePngHeader(CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE, CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE),
    ),
    true,
  );
  assert.equal(isValidSubscriptionBadgePng(makePngHeader(60, 60)), false);
});
