// 라이브 룰렛 SSE 이벤트를 방송별 메모리 구독자에게 전달합니다.

export const LIVE_ROULETTE_SSE_EVENT = "roulette_notice";

export type LiveRouletteSseStatus = "active" | "ended";

export interface LiveRouletteSsePayload {
  createdAt: string;
  durationSeconds?: number;
  id: string;
  items: string[];
  resultLabel: string;
  rotationKeyframes: number[];
  status: LiveRouletteSseStatus;
}

type LiveRouletteSseListener = (message: string) => void;

interface LiveRouletteResultDelayNotice {
  durationSeconds?: number;
  id: string;
  status: LiveRouletteSseStatus;
}

interface LiveRouletteResultDelayInput {
  activeNotice: LiveRouletteResultDelayNotice | null;
  activeReceivedAtMs: number | null;
  nextNotice: Pick<LiveRouletteResultDelayNotice, "id" | "status">;
  nowMs: number;
}

export function formatLiveRouletteSseMessage(payload: LiveRouletteSsePayload) {
  return `event: ${LIVE_ROULETTE_SSE_EVENT}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export function getLiveRouletteResultDelayMs({
  activeNotice,
  activeReceivedAtMs,
  nextNotice,
  nowMs,
}: LiveRouletteResultDelayInput) {
  if (
    !activeNotice ||
    activeNotice.status !== "active" ||
    nextNotice.status !== "ended" ||
    activeNotice.id !== nextNotice.id ||
    typeof activeReceivedAtMs !== "number" ||
    !Number.isFinite(activeReceivedAtMs) ||
    typeof activeNotice.durationSeconds !== "number" ||
    !Number.isFinite(activeNotice.durationSeconds)
  ) {
    return 0;
  }

  const durationMs = activeNotice.durationSeconds * 1000;
  const elapsedMs = nowMs - activeReceivedAtMs;

  return Math.max(0, durationMs - elapsedMs);
}

export function createLiveRouletteSseStore() {
  const listenersByBroadcastId = new Map<string, Set<LiveRouletteSseListener>>();

  function subscribe(broadcastId: string, listener: LiveRouletteSseListener) {
    const listeners = listenersByBroadcastId.get(broadcastId) ?? new Set<LiveRouletteSseListener>();

    listeners.add(listener);
    listenersByBroadcastId.set(broadcastId, listeners);

    return () => {
      listeners.delete(listener);

      if (listeners.size === 0) {
        listenersByBroadcastId.delete(broadcastId);
      }
    };
  }

  function publish(broadcastId: string, payload: LiveRouletteSsePayload) {
    const listeners = listenersByBroadcastId.get(broadcastId);

    if (!listeners) return 0;

    const message = formatLiveRouletteSseMessage(payload);

    listeners.forEach((listener) => listener(message));

    return listeners.size;
  }

  return {
    publish,
    subscribe,
  };
}

const globalForLiveRouletteSse = globalThis as typeof globalThis & {
  __pixelPlayLiveRouletteSseStore?: ReturnType<typeof createLiveRouletteSseStore>;
};

export const liveRouletteSseStore =
  globalForLiveRouletteSse.__pixelPlayLiveRouletteSseStore ?? createLiveRouletteSseStore();

globalForLiveRouletteSse.__pixelPlayLiveRouletteSseStore = liveRouletteSseStore;
