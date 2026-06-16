// 채널 구독 이모티콘 업로드 파일명과 storage 경로 규칙을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildChannelSubscriptionEmoteStoragePath,
  normalizeChannelSubscriptionEmoteTitle,
} from "./channel-subscription-emote-upload.ts";

test("normalizeChannelSubscriptionEmoteTitle accepts Korean and alphanumeric titles", () => {
  assert.equal(normalizeChannelSubscriptionEmoteTitle(" 하이 "), "하이");
  assert.equal(normalizeChannelSubscriptionEmoteTitle("happy12"), "happy12");
});

test("normalizeChannelSubscriptionEmoteTitle rejects unsafe or too long titles", () => {
  assert.equal(normalizeChannelSubscriptionEmoteTitle(""), null);
  assert.equal(normalizeChannelSubscriptionEmoteTitle("구독/하이"), null);
  assert.equal(normalizeChannelSubscriptionEmoteTitle("가나다라마바사"), null);
  assert.equal(normalizeChannelSubscriptionEmoteTitle("abcdefghijklmn"), null);
});

test("buildChannelSubscriptionEmoteStoragePath scopes common and plus emotes to creator storage", () => {
  assert.equal(
    buildChannelSubscriptionEmoteStoragePath({
      creatorId: "creator-id",
      title: "하이",
      tier: "common",
      extension: "png",
      target: "pc",
    }),
    "creator-id/emoticon/하이.png",
  );
  assert.equal(
    buildChannelSubscriptionEmoteStoragePath({
      creatorId: "creator-id",
      title: "wow",
      tier: "plus",
      extension: "webp",
      target: "mobile",
    }),
    "creator-id/emoticon/mobile/plus-wow.webp",
  );
});
