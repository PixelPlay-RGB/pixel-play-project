// 라이브 구독 이모티콘 storage 파일 목록 정리를 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { readLiveSubscriptionEmotes } from "./live-subscription-emote.ts";

const CREATOR_ID = "89dac974-c64f-431f-b593-dd71882c0d33";

test("readLiveSubscriptionEmotes keeps image files and builds versioned public URLs", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

  try {
    assert.deepEqual(
      readLiveSubscriptionEmotes(CREATOR_ID, [
        { name: "hello.png", updated_at: "2026-06-16T01:00:00.000Z" },
        { name: "wow.gif", updated_at: "2026-06-16T02:00:00.000Z" },
        { name: "ignore.txt", updated_at: "2026-06-16T03:00:00.000Z" },
      ]),
      [
        {
          name: "hello",
          src: "https://example.supabase.co/storage/v1/object/public/user-media/89dac974-c64f-431f-b593-dd71882c0d33/emoticon/hello.png?v=2026-06-16T01%3A00%3A00.000Z",
          updatedAt: "2026-06-16T01:00:00.000Z",
        },
        {
          name: "wow",
          src: "https://example.supabase.co/storage/v1/object/public/user-media/89dac974-c64f-431f-b593-dd71882c0d33/emoticon/wow.gif?v=2026-06-16T02%3A00%3A00.000Z",
          updatedAt: "2026-06-16T02:00:00.000Z",
        },
      ],
    );
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  }
});
