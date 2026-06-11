// 방송 운영 입력 검증 스키마의 라이브 상호작용 제한을 검증합니다.
import assert from "node:assert/strict";
import test from "node:test";

import { createChannelLivePollSchema } from "./channel-live.ts";

test("createChannelLivePollSchema accepts more than five poll options", () => {
  const result = createChannelLivePollSchema.safeParse({
    broadcastId: "11111111-1111-4111-8111-111111111111",
    endsAt: null,
    options: ["하나", "둘", "셋", "넷", "다섯", "여섯"],
    title: "테스트 투표",
  });

  assert.equal(result.success, true);
});
