// Realtime 채널 구독을 지수 백오프 재연결과 함께 관리합니다(통계 구독 공통).

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import type { AnalyticsConnectionState } from "@/types/channel/analytics";

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const RECONNECT_JITTER_MS = 1_000; // 동시 재연결 thundering-herd 방지
const ERROR_STATUSES = new Set(["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"]);

interface ReconnectingChannelOptions {
  // 채널 + .on(...) 핸들러까지만 붙여 반환한다(구독은 헬퍼가 담당).
  buildChannel: () => RealtimeChannel;
  onConnectionChange: (state: AnalyticsConnectionState) => void;
}

// 구독을 시작하고, 끊기면 백오프로 재연결한다. 반환된 cleanup을 effect에서 호출한다.
export function startReconnectingChannel(
  supabase: SupabaseClient,
  { buildChannel, onConnectionChange }: ReconnectingChannelOptions,
): () => void {
  let channel: RealtimeChannel | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let cancelled = false;

  const connect = () => {
    channel = buildChannel();
    channel.subscribe((status) => {
      if (cancelled) {
        return;
      }

      if (status === "SUBSCRIBED") {
        attempt = 0;
        onConnectionChange("connected");
        return;
      }

      if (ERROR_STATUSES.has(status)) {
        onConnectionChange("reconnecting");
        scheduleReconnect();
      }
    });
  };

  const scheduleReconnect = () => {
    if (cancelled || reconnectTimer) {
      return;
    }

    const delay =
      Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS) +
      Math.random() * RECONNECT_JITTER_MS;
    attempt += 1;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;

      // 같은 topic의 이전 채널 제거가 끝난 뒤 재생성해야 구독이 좀비가 되지 않는다.
      void (async () => {
        if (channel) {
          await supabase.removeChannel(channel);
        }

        if (cancelled) {
          return;
        }

        connect();
      })();
    }, delay);
  };

  connect();

  return () => {
    cancelled = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    if (channel) {
      void supabase.removeChannel(channel);
    }
  };
}

// 여러 구독의 연결 상태를 합쳐 헤더 인디케이터용 단일 상태로 만든다(최악 우선).
export function resolveConnectionState(
  states: AnalyticsConnectionState[],
): AnalyticsConnectionState {
  if (states.includes("reconnecting")) {
    return "reconnecting";
  }

  if (states.includes("connecting")) {
    return "connecting";
  }

  return "connected";
}
