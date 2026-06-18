// 채널 이모지 토큰 사용에 필요한 구독 권한 판정을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { getMissingChannelEmojiSubscriptionCreatorIds } from "./channel-emoji-access.ts";

test("getMissingChannelEmojiSubscriptionCreatorIds returns unsubscribed owners for known channel emoji tokens", () => {
  const creatorA = "11111111-1111-4111-8111-111111111111";
  const creatorB = "22222222-2222-4222-8222-222222222222";
  const emojiA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const emojiB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  assert.deepEqual(
    getMissingChannelEmojiSubscriptionCreatorIds({
      tokenIds: [emojiA, emojiB, emojiA],
      emojiOwners: [
        { id: emojiA, creatorId: creatorA },
        { id: emojiB, creatorId: creatorB },
      ],
      subscribedCreatorIds: [creatorB],
    }),
    [creatorA],
  );
});

test("getMissingChannelEmojiSubscriptionCreatorIds ignores unknown token ids", () => {
  assert.deepEqual(
    getMissingChannelEmojiSubscriptionCreatorIds({
      tokenIds: ["not-a-channel-emoji"],
      emojiOwners: [],
      subscribedCreatorIds: [],
    }),
    [],
  );
});
