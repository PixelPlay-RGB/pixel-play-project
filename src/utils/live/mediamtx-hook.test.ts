// MediaMTX hook path와 활성 방송 후보 매칭 규칙을 검증합니다.
import assert from "node:assert/strict";
import test from "node:test";

import { findActiveBroadcastForMediaMtxPath, normalizeMediaMtxPath } from "./mediamtx-hook.ts";

const candidates = [
  { broadcastId: "broadcast-a", creatorId: "creator-a", streamKeyVersion: 1 },
  { broadcastId: "broadcast-b", creatorId: "creator-b", streamKeyVersion: 3 },
];

test("normalizeMediaMtxPath trims slashes and decodes path values", () => {
  assert.equal(normalizeMediaMtxPath("/live%2Fpp_live_key/"), "live/pp_live_key");
});

test("findActiveBroadcastForMediaMtxPath matches normalized MediaMTX paths", () => {
  const matched = findActiveBroadcastForMediaMtxPath({
    candidates,
    createStreamPath: (candidate) =>
      `live/key-${candidate.creatorId}-${candidate.streamKeyVersion}`,
    streamPath: "/live/key-creator-b-3/",
  });

  assert.deepEqual(matched, candidates[1]);
});

test("findActiveBroadcastForMediaMtxPath returns null for unknown paths", () => {
  const matched = findActiveBroadcastForMediaMtxPath({
    candidates,
    createStreamPath: (candidate) =>
      `live/key-${candidate.creatorId}-${candidate.streamKeyVersion}`,
    streamPath: "live/unknown",
  });

  assert.equal(matched, null);
});
