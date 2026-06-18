// 라이브 메시지 행을 채팅 UI 메시지로 변환하는 규칙을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { mapLiveMessageRowToMessage, type LiveMessageRow } from "./live-message.ts";

test("keeps the subscription badge metadata when a subscriber also has the donor role", () => {
  const message = mapLiveMessageRowToMessage({
    id: "message-1",
    created_at: "2026-06-16T03:00:00.000Z",
    sender_id: "subscriber-id",
    message_type: "chat",
    content: "hello",
    sender_role: "donor",
    metadata: {
      senderNickname: "구독후원자",
      isDonor: true,
      isSubscriber: true,
      subscriptionTotalMonths: 7,
    },
  } satisfies LiveMessageRow);

  assert.ok(message);
  assert.equal(message.type, "text");
  assert.equal(message.senderRole, "donor");
  assert.equal(message.isSubscriber, true);
  assert.equal(message.subscriptionTotalMonths, 7);
});
