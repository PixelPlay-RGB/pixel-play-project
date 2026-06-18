// 구독 채널 이모지 피커 그룹 생성 규칙을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { createChannelStickerGroups } from "./channel-sticker-groups.ts";

test("createChannelStickerGroups returns one profile group per creator with stickers", () => {
  assert.deepEqual(
    createChannelStickerGroups({
      creatorIds: ["creator-a", "creator-b", "creator-c"],
      profiles: [
        { id: "creator-a", nickname: "채널A", photoUrl: "a.png" },
        { id: "creator-b", nickname: "채널B", photoUrl: "b.png" },
      ],
      stickers: [
        {
          creatorId: "creator-b",
          sticker: { id: "emoji-b", label: "비", src: "/b.png" },
        },
        {
          creatorId: "creator-a",
          sticker: { id: "emoji-a", label: "에이", src: "/a.png" },
        },
      ],
    }),
    [
      {
        creatorId: "creator-a",
        label: "채널A",
        avatarUrl: "a.png",
        stickers: [{ id: "emoji-a", label: "에이", src: "/a.png" }],
      },
      {
        creatorId: "creator-b",
        label: "채널B",
        avatarUrl: "b.png",
        stickers: [{ id: "emoji-b", label: "비", src: "/b.png" }],
      },
    ],
  );
});

test("createChannelStickerGroups deduplicates creators and hides creators without stickers", () => {
  assert.deepEqual(
    createChannelStickerGroups({
      creatorIds: ["creator-a", "creator-a", "creator-b"],
      profiles: [],
      stickers: [
        {
          creatorId: "creator-a",
          sticker: { id: "emoji-a", label: "에이", src: "/a.png" },
        },
      ],
    }),
    [
      {
        creatorId: "creator-a",
        label: "알 수 없음",
        avatarUrl: null,
        stickers: [{ id: "emoji-a", label: "에이", src: "/a.png" }],
      },
    ],
  );
});
