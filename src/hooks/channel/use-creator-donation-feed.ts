"use client";
// 진행 중인 방송의 후원을 donation Realtime(INSERT)으로 받아 상호작용 로그 이벤트로 변환합니다.

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { AnalyticsLogEvent } from "@/types/channel/analytics";
import type { Tables } from "@/types/database.types";

type DonationRow = Tables<"donation">;

export function useCreatorDonationFeed(
  broadcastId: string,
  initialDonations: AnalyticsLogEvent[],
): AnalyticsLogEvent[] {
  const [events, setEvents] = useState<AnalyticsLogEvent[]>(initialDonations);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`channel-analytics-donation:${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donation",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        (payload) => {
          const row = payload.new as DonationRow;

          setEvents((prev) =>
            prev.some((event) => event.id === row.id)
              ? prev
              : [{ id: row.id, type: "donation", at: row.created_at, amount: row.amount }, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [broadcastId]);

  return events;
}
