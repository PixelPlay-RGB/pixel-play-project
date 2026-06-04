"use client";
// 방송별 Realtime Presence로 현재 동접을 클라이언트에서 집계합니다.
// 통계 화면은 관찰자라 track하지 않고(본인을 시청자로 세지 않음) 시청자 join만 센다(presence sync는 track 없이도 수신).
// 시청자가 같은 채널에 join하기 전(시청 화면 미머지)에는 멤버 0이라 폴백값을 쓴다.

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type {
  AnalyticsConnectionState,
  CreatorLivePresence,
} from "@/types/channel/analytics";
import { startReconnectingChannel } from "@/utils/channel/realtime-reconnect";

const PRESENCE_TOPIC_PREFIX = "live-presence:";

export function useCreatorLivePresence(
  broadcastId: string,
  fallbackViewers: number,
): CreatorLivePresence {
  const [distinctViewers, setDistinctViewers] = useState(0);
  const [connection, setConnection] = useState<AnalyticsConnectionState>("connecting");

  useEffect(() => {
    const supabase = createClient();
    const topic = `${PRESENCE_TOPIC_PREFIX}${broadcastId}`;

    return startReconnectingChannel(supabase, {
      buildChannel: () => {
        const channel = supabase.channel(topic);

        channel.on("presence", { event: "sync" }, () => {
          setDistinctViewers(Object.keys(channel.presenceState()).length);
        });

        return channel;
      },
      onConnectionChange: setConnection,
    });
  }, [broadcastId]);

  // 시청자 presence가 잡히기 전에는 스냅샷 동접으로 폴백한다.
  const isAggregating = distinctViewers > 0;

  return {
    viewers: isAggregating ? distinctViewers : fallbackViewers,
    isAggregating,
    connection,
  };
}
