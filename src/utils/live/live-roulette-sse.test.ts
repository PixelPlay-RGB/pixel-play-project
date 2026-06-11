// 라이브 룰렛 SSE 구독 저장소가 방송별로 이벤트를 분리하는지 검증합니다.
import assert from "node:assert/strict";
import test from "node:test";

import {
  createLiveRouletteSseStore,
  formatLiveRouletteSseMessage,
  type LiveRouletteSsePayload,
} from "./live-roulette-sse.ts";

const payload: LiveRouletteSsePayload = {
  createdAt: "2026-06-11T00:00:00.000Z",
  id: "roulette-1",
  items: ["A", "B"],
  resultLabel: "A",
  rotationKeyframes: [0, 10, 20, 30],
  status: "active",
};

test("createLiveRouletteSseStore publishes only to matching broadcast subscribers", () => {
  const store = createLiveRouletteSseStore();
  const firstBroadcastMessages: string[] = [];
  const otherBroadcastMessages: string[] = [];

  store.subscribe("broadcast-1", (message) => firstBroadcastMessages.push(message));
  store.subscribe("broadcast-2", (message) => otherBroadcastMessages.push(message));

  const sentCount = store.publish("broadcast-1", payload);

  assert.equal(sentCount, 1);
  assert.equal(firstBroadcastMessages.length, 1);
  assert.equal(otherBroadcastMessages.length, 0);
  assert.match(firstBroadcastMessages[0], /^event: roulette_notice\n/);
});

test("createLiveRouletteSseStore stops publishing after unsubscribe", () => {
  const store = createLiveRouletteSseStore();
  const messages: string[] = [];
  const unsubscribe = store.subscribe("broadcast-1", (message) => messages.push(message));

  unsubscribe();
  const sentCount = store.publish("broadcast-1", payload);

  assert.equal(sentCount, 0);
  assert.deepEqual(messages, []);
});

test("formatLiveRouletteSseMessage serializes a roulette notice event", () => {
  assert.equal(
    formatLiveRouletteSseMessage(payload),
    `event: roulette_notice\ndata: ${JSON.stringify(payload)}\n\n`,
  );
});
