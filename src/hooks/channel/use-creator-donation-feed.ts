"use client";
// 진행 중인 방송의 후원을 donation Realtime(INSERT)으로 받아 상호작용 로그 이벤트로 변환합니다.

import { useEffect, useState } from "react";

import { ANALYTICS_DONATION_LOG_LIMIT } from "@/constants/channel/analytics";
import { createClient } from "@/lib/supabase/client";
import type { AnalyticsConnectionState, AnalyticsLogEvent } from "@/types/channel/analytics";
import { normalizeDonationRow } from "@/utils/channel/channel-analytics-normalize";
import { startReconnectingChannel } from "@/utils/channel/realtime-reconnect";

interface CreatorDonationFeed {
  events: AnalyticsLogEvent[];
  connection: AnalyticsConnectionState;
}

export function useCreatorDonationFeed(
  broadcastId: string,
  initialDonations: AnalyticsLogEvent[],
): CreatorDonationFeed {
  const [events, setEvents] = useState<AnalyticsLogEvent[]>(initialDonations);
  const [connection, setConnection] = useState<AnalyticsConnectionState>("connecting");

  useEffect(() => {
    const supabase = createClient();

    return startReconnectingChannel(supabase, {
      buildChannel: () =>
        supabase.channel(`channel-analytics-donation:${broadcastId}`).on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "donation",
            filter: `broadcast_id=eq.${broadcastId}`,
          },
          (payload) => {
            const event = normalizeDonationRow(payload.new, broadcastId);

            if (!event) {
              return;
            }

            setEvents((prev) =>
              prev.some((existing) => existing.id === event.id)
                ? prev
                : [event, ...prev].slice(0, ANALYTICS_DONATION_LOG_LIMIT),
            );
          },
        ),
      onConnectionChange: setConnection,
    });
  }, [broadcastId]);

  return { events, connection };
}
