// 라이브 추첨 참여자 필터링 규칙을 검증합니다.
import assert from "node:assert/strict";
import test from "node:test";

import { filterChannelLiveDrawParticipants } from "./channel-live-draw.ts";

const participants = [
  { firstMessageAt: "2026-06-10T00:00:01.000Z", isFollower: true, nickname: "아리", userId: "1" },
  { firstMessageAt: "2026-06-10T00:00:02.000Z", isFollower: false, nickname: "오네", userId: "2" },
  { firstMessageAt: "2026-06-10T00:00:03.000Z", isFollower: true, nickname: "럭스", userId: "3" },
];

test("filterChannelLiveDrawParticipants keeps only followers when follower only is enabled", () => {
  const result = filterChannelLiveDrawParticipants(participants, [], {
    excludePreviousWinners: false,
    followerOnly: true,
  });

  assert.deepEqual(
    result.map((participant) => participant.nickname),
    ["아리", "럭스"],
  );
});

test("filterChannelLiveDrawParticipants removes previous winners only when the option is enabled", () => {
  const result = filterChannelLiveDrawParticipants(participants, ["1"], {
    excludePreviousWinners: true,
    followerOnly: false,
  });

  assert.deepEqual(
    result.map((participant) => participant.nickname),
    ["오네", "럭스"],
  );
});
