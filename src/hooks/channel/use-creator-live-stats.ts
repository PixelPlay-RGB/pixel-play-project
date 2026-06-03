"use client";
// 진행 중인 방송의 집계 지표를 live_broadcast Realtime으로 갱신하고,
// 시청자 추이·분당 메시지 파생을 위해 샘플을 누적합니다.

import { useEffect, useMemo, useState } from "react";

import { ANALYTICS_SAMPLE_CAP } from "@/constants/channel/analytics";
import { createClient } from "@/lib/supabase/client";
import type {
  AnalyticsBroadcast,
  AnalyticsSample,
  CreatorLiveStats,
} from "@/types/channel/analytics";
import type { Tables } from "@/types/database.types";
import { deriveMessageMetrics } from "@/utils/channel/channel-analytics-metrics";

type LiveBroadcastRow = Tables<"live_broadcast">;

interface Counters {
  currentViewers: number;
  peakViewers: number;
  chatMessageCount: number;
  donationCount: number;
  donationAmountTotal: number;
}

export function useCreatorLiveStats(broadcast: AnalyticsBroadcast): CreatorLiveStats {
  const [counters, setCounters] = useState<Counters>(() => ({
    currentViewers: broadcast.currentViewerCount,
    peakViewers: broadcast.peakViewerCount,
    chatMessageCount: broadcast.chatMessageCount,
    donationCount: broadcast.donationCount,
    donationAmountTotal: broadcast.donationAmountTotal,
  }));
  const [samples, setSamples] = useState<AnalyticsSample[]>(() => [
    { at: Date.now(), viewers: broadcast.currentViewerCount, chatCount: broadcast.chatMessageCount },
  ]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`channel-analytics-stats:${broadcast.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_broadcast",
          filter: `id=eq.${broadcast.id}`,
        },
        (payload) => {
          const row = payload.new as LiveBroadcastRow;

          setCounters({
            currentViewers: row.current_viewer_count,
            peakViewers: row.peak_viewer_count,
            chatMessageCount: row.chat_message_count,
            donationCount: row.donation_count,
            donationAmountTotal: row.donation_amount_total,
          });

          setSamples((prev) => {
            const next = [
              ...prev,
              {
                at: Date.now(),
                viewers: row.current_viewer_count,
                chatCount: row.chat_message_count,
              },
            ];

            return next.length > ANALYTICS_SAMPLE_CAP
              ? next.slice(next.length - ANALYTICS_SAMPLE_CAP)
              : next;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [broadcast.id]);

  const { messagesPerMinute, messagesPerMinuteTrend } = useMemo(
    () => deriveMessageMetrics(samples),
    [samples],
  );

  return { ...counters, messagesPerMinute, messagesPerMinuteTrend, samples };
}
