// 스티커 토큰 문자열에서 토큰 id를 추출하는 규칙을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { buildStickerToken, extractStickerTokenIds } from "./sticker-token.ts";

test("extractStickerTokenIds returns unique sticker token ids in first-seen order", () => {
  const hi = buildStickerToken("hi-rgb");
  const channelEmoji = buildStickerToken("0f1e2d3c-4b5a-6978-8f90-123456789abc");

  assert.deepEqual(extractStickerTokenIds(`${hi} hello ${channelEmoji} ${hi}`), [
    "hi-rgb",
    "0f1e2d3c-4b5a-6978-8f90-123456789abc",
  ]);
});

test("extractStickerTokenIds ignores non sticker-looking text", () => {
  assert.deepEqual(extractStickerTokenIds(":other-hi: :pp-한글: plain"), []);
});
