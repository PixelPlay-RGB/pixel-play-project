"use client";
// 진행 중인 방송의 집계 지표를 live_broadcast Realtime으로 갱신하고,
// 시계열은 채팅 트래픽과 분리된 고정 주기로 누적해 시청자 추이·분당 메시지를 파생합니다.

import { useEffect, useMemo, useRef, useState } from "react";

import {
  ANALYTICS_SAMPLE_CAP,
  ANALYTICS_SAMPLE_INTERVAL_MS,
} from "@/constants/channel/analytics";
import { createClient } from "@/lib/supabase/client";
import type {
  AnalyticsBroadcast,
  AnalyticsConnectionState,
  AnalyticsSample,
  CreatorLiveStats,
} from "@/types/channel/analytics";
import {
  deriveDonationTrend,
  deriveMessageMetrics,
  deriveViewerTrend,
} from "@/utils/channel/channel-analytics-metrics";
import { normalizeLiveBroadcastCounters } from "@/utils/channel/channel-analytics-normalize";
import { startReconnectingChannel } from "@/utils/channel/realtime-reconnect";

interface Counters {
  peakViewers: number;
  chatMessageCount: number;
  donationCount: number;
  donationAmountTotal: number;
}

// presenceViewers는 presence 동접(미연동 시 폴백값)으로, 시계열의 viewers 축에 적재한다.
export function useCreatorLiveStats(
  broadcast: AnalyticsBroadcast,
  presenceViewers: number,
): CreatorLiveStats {
  const [counters, setCounters] = useState<Counters>(() => ({
    peakViewers: broadcast.peakViewerCount,
    chatMessageCount: broadcast.chatMessageCount,
    donationCount: broadcast.donationCount,
    donationAmountTotal: broadcast.donationAmountTotal,
  }));
  const [samples, setSamples] = useState<AnalyticsSample[]>(() => [
    {
      at: Date.now(),
      viewers: broadcast.currentViewerCount,
      chatCount: broadcast.chatMessageCount,
      donationAmountTotal: broadcast.donationAmountTotal,
    },
  ]);
  const [connection, setConnection] = useState<AnalyticsConnectionState>("connecting");

  // 고정 주기 타이머가 최신 값을 읽도록 ref로 보관(타이머 재생성 방지).
  const countersRef = useRef(counters);
  const viewersRef = useRef(presenceViewers);

  useEffect(() => {
    countersRef.current = counters;
  }, [counters]);

  useEffect(() => {
    viewersRef.current = presenceViewers;
  }, [presenceViewers]);

  // live_broadcast UPDATE 구독: KPI 카운터를 즉시 갱신하고 연결 상태를 추적한다.
  useEffect(() => {
    const supabase = createClient();

    return startReconnectingChannel(supabase, {
      buildChannel: () =>
        supabase.channel(`channel-analytics-stats:${broadcast.id}`).on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "live_broadcast",
            filter: `id=eq.${broadcast.id}`,
          },
          (payload) => {
            const normalized = normalizeLiveBroadcastCounters(payload.new, broadcast.id);

            if (normalized) {
              setCounters(normalized);
            }
          },
        ),
      onConnectionChange: setConnection,
    });
  }, [broadcast.id]);

  // 고정 주기 시계열 적재(탭이 백그라운드면 건너뛰어 부하를 줄인다).
  useEffect(() => {
    const appendSample = () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      setSamples((prev) => {
        const next = [
          ...prev,
          {
            at: Date.now(),
            viewers: viewersRef.current,
            chatCount: countersRef.current.chatMessageCount,
            donationAmountTotal: countersRef.current.donationAmountTotal,
          },
        ];

        return next.length > ANALYTICS_SAMPLE_CAP
          ? next.slice(next.length - ANALYTICS_SAMPLE_CAP)
          : next;
      });
    };

    const intervalId = setInterval(appendSample, ANALYTICS_SAMPLE_INTERVAL_MS);
    const handleVisibility = () => {
      if (!document.hidden) {
        appendSample();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [broadcast.id]);

  const derived = useMemo(
    () => ({
      ...deriveMessageMetrics(samples),
      viewerTrend: deriveViewerTrend(samples),
      donationTrend: deriveDonationTrend(samples),
    }),
    [samples],
  );

  // 표시 중인 현재 시청자는 presence라, 최고 시청자도 같은 소스(presence + 스냅샷 seed)로
  // 파생해 "현재 > 최고" 모순을 막는다. live_broadcast peak 컬럼은 writer가 없어 seed로만 쓴다.
  const peakViewers = useMemo(() => {
    let peak = Math.max(counters.peakViewers, presenceViewers);

    for (const sample of samples) {
      if (sample.viewers > peak) {
        peak = sample.viewers;
      }
    }

    return peak;
  }, [counters.peakViewers, presenceViewers, samples]);

  return {
    ...counters,
    peakViewers,
    messagesPerMinute: derived.messagesPerMinute,
    messagesPerMinuteTrend: derived.messagesPerMinuteTrend,
    viewerTrend: derived.viewerTrend,
    donationTrend: derived.donationTrend,
    samples,
    connection,
  };
}
