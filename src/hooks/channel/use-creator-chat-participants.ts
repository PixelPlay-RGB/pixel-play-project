"use client";
// 진행 중인 방송의 live_message INSERT를 구독해 최근 윈도우 내 고유 채팅 참여자 수를 집계합니다.
// (live_broadcast.chat_message_count는 총량이라 "몇 명이 떠드는지"는 sender_id distinct로만 알 수 있다.)

import { useEffect, useRef, useState } from "react";

import {
  ANALYTICS_PARTICIPANT_PRUNE_MS,
  ANALYTICS_PARTICIPANT_WINDOW_MS,
} from "@/constants/channel/analytics";
import { createClient } from "@/lib/supabase/client";
import type { AnalyticsConnectionState, CreatorChatParticipants } from "@/types/channel/analytics";
import { readObject, readText } from "@/utils/channel/channel-analytics-read";
import { startReconnectingChannel } from "@/utils/channel/realtime-reconnect";

export function useCreatorChatParticipants(broadcastId: string): CreatorChatParticipants {
  const [uniqueCount, setUniqueCount] = useState(0);
  const [connection, setConnection] = useState<AnalyticsConnectionState>("connecting");

  // sender_id → 마지막 채팅 시각(ms). 윈도우를 벗어난 항목은 prune해 distinct 회전을 반영한다.
  const lastSeenRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // broadcastId가 바뀌면 이전 방송의 참여자 흔적을 비우고 다시 집계한다.
    const lastSeen = lastSeenRef.current;
    lastSeen.clear();

    const prune = (now: number) => {
      const minAt = now - ANALYTICS_PARTICIPANT_WINDOW_MS;

      for (const [senderId, seenAt] of lastSeen) {
        if (seenAt < minAt) {
          lastSeen.delete(senderId);
        }
      }
    };

    const supabase = createClient();
    const stop = startReconnectingChannel(supabase, {
      buildChannel: () =>
        supabase.channel(`channel-analytics-participants:${broadcastId}`).on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "live_message",
            filter: `broadcast_id=eq.${broadcastId}`,
          },
          (payload) => {
            const row = readObject(payload.new);
            const senderId = row ? readText(row.sender_id) : null;

            // filter가 broadcast를 좁히지만 payload를 재검증하고 발신자 없는 행은 버린다.
            if (!senderId || (row && readText(row.broadcast_id) !== broadcastId)) {
              return;
            }

            const now = Date.now();
            lastSeen.set(senderId, now);
            prune(now);
            setUniqueCount(lastSeen.size);
          },
        ),
      onConnectionChange: setConnection,
    });

    // 새 메시지가 없어도 만료된 참여자를 걷어내 카운트가 자연히 감소하게 한다.
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      prune(Date.now());
      setUniqueCount(lastSeen.size);
    }, ANALYTICS_PARTICIPANT_PRUNE_MS);

    return () => {
      clearInterval(intervalId);
      stop();
    };
  }, [broadcastId]);

  return { uniqueCount, connection };
}
