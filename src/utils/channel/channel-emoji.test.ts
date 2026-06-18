// 채널 이모티콘 유틸의 변환 동작을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { getChannelEmojiSrc, mapChannelEmojiRows } from "./channel-emoji.ts";

test("mapChannelEmojiRows converts database rows to channel emoji previews", () => {
  const emojis = mapChannelEmojiRows([
    {
      id: "emoji-1",
      image_path: "creator-1/emoji/butterfly.png",
      name: "나비",
      sort_order: 3,
    },
  ]);

  assert.deepEqual(emojis, [
    {
      id: "emoji-1",
      imageUrl: getChannelEmojiSrc("creator-1/emoji/butterfly.png"),
      name: "나비",
      sortOrder: 3,
    },
  ]);
});
