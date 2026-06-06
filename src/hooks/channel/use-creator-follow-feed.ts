"use client";
// 진행 중인 방송 크리에이터의 팔로우/언팔로우 이벤트를 creator_follow_event로 집계합니다.
// followed_at 전이를 트리거가 이벤트로 적재하므로 폴링 없이 초기 쿼리 + Realtime INSERT로 갱신합니다.

import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  ANALYTICS_FOLLOW_EVENT_LOG_LIMIT,
  ANALYTICS_FOLLOW_EVENT_REFETCH_MS,
  ANALYTICS_FOLLOW_EVENT_WINDOW_MS,
} from "@/constants/channel/analytics";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import type {
  AnalyticsConnectionState,
  AnalyticsLogEvent,
  FollowFeed,
} from "@/types/channel/analytics";
import { normalizeFollowEventRow } from "@/utils/channel/channel-analytics-normalize";
import { startReconnectingChannel } from "@/utils/channel/realtime-reconnect";

// 초기 쿼리 결과와 Realtime 수신분을 id 기준 중복 제거 후 최신순으로 합쳐 상한까지만 남긴다.
function mergeFollowEvents(
  realtime: AnalyticsLogEvent[],
  initial: AnalyticsLogEvent[],
): AnalyticsLogEvent[] {
  const merged: AnalyticsLogEvent[] = [];
  const seen = new Set<string>();

  for (const event of [...realtime, ...initial]) {
    if (seen.has(event.id)) {
      continue;
    }

    seen.add(event.id);
    merged.push(event);
  }

  return merged
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, ANALYTICS_FOLLOW_EVENT_LOG_LIMIT);
}

// "팔로우 증가" KPI = 윈도우 내 순증(신규 팔로우 +1, 언팔로우 −1). 취소가 더 많으면 음수.
function deriveFollowNet(events: AnalyticsLogEvent[]): number {
  return events.reduce((sum, event) => {
    if (event.type === "follow") {
      return sum + 1;
    }

    if (event.type === "unfollow") {
      return sum - 1;
    }

    return sum;
  }, 0);
}

export function useCreatorFollowFeed(creatorId: string): FollowFeed {
  const supabase = useMemo(() => createClient(), []);
  const [realtimeEvents, setRealtimeEvents] = useState<AnalyticsLogEvent[]>([]);
  const [connection, setConnection] = useState<AnalyticsConnectionState>("connecting");
  // 윈도우 컷의 기준 시각. 주기적으로 갱신해 렌더 중 Date.now() 없이 오래된 이벤트를 떨군다.
  const [windowAnchor, setWindowAnchor] = useState(() => Date.now());

  const query = useQuery<AnalyticsLogEvent[]>({
    queryKey: QUERY_KEYS.channel.analyticsFollowFeed(creatorId),
    queryFn: async () => {
      const since = new Date(Date.now() - ANALYTICS_FOLLOW_EVENT_WINDOW_MS).toISOString();
      const { data, error } = await supabase
        .from("creator_follow_event")
        .select("id, creator_id, event_type, viewer_nickname, created_at")
        .eq("creator_id", creatorId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(ANALYTICS_FOLLOW_EVENT_LOG_LIMIT);

      if (error) {
        console.error("팔로우 이벤트 조회 실패", error);
        throw error;
      }

      return (data ?? [])
        .map((row) => normalizeFollowEventRow(row, creatorId))
        .filter((event): event is AnalyticsLogEvent => event !== null);
    },
    enabled: Boolean(creatorId),
    // 윈도우 밖으로 밀려난 항목 제거 + 끊김 동안 놓친 이벤트를 주기적으로 보정한다.
    refetchInterval: ANALYTICS_FOLLOW_EVENT_REFETCH_MS,
  });

  // refetch와 같은 주기로 윈도우 기준 시각을 갱신해 realtime 누적분도 30분 경계에서 떨군다.
  // 탭이 백그라운드면 건너뛴다(refetch도 백그라운드 정지라 갱신 주기를 맞춘다).
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      setWindowAnchor(Date.now());
    }, ANALYTICS_FOLLOW_EVENT_REFETCH_MS);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!creatorId) {
      return;
    }

    return startReconnectingChannel(supabase, {
      buildChannel: () =>
        supabase.channel(`channel-analytics-follow:${creatorId}`).on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "creator_follow_event",
            filter: `creator_id=eq.${creatorId}`,
          },
          (payload) => {
            const event = normalizeFollowEventRow(payload.new, creatorId);

            if (!event) {
              return;
            }

            setRealtimeEvents((prev) =>
              prev.some((existing) => existing.id === event.id)
                ? prev
                : [event, ...prev].slice(0, ANALYTICS_FOLLOW_EVENT_LOG_LIMIT),
            );
          },
        ),
      onConnectionChange: setConnection,
    });
  }, [creatorId, supabase]);

  const events = useMemo(() => {
    const minAt = windowAnchor - ANALYTICS_FOLLOW_EVENT_WINDOW_MS;

    return mergeFollowEvents(realtimeEvents, query.data ?? []).filter(
      (event) => new Date(event.at).getTime() >= minAt,
    );
  }, [realtimeEvents, query.data, windowAnchor]);

  const count = useMemo(() => deriveFollowNet(events), [events]);

  return { count, events, isError: query.isError, connection };
}
