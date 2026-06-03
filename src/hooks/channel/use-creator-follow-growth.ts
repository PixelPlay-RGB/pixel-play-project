"use client";
// 최근 30분 팔로우 증가 수와 팔로우 로그 이벤트를 viewer_creator_relation 폴링으로 조회합니다.
// 이 테이블은 supabase_realtime 발행 대상이 아니라 주기 폴링으로 갱신합니다.

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  ANALYTICS_FOLLOW_LOG_LIMIT,
  ANALYTICS_FOLLOW_POLL_MS,
  ANALYTICS_FOLLOW_WINDOW_MS,
} from "@/constants/channel/analytics";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { AnalyticsLogEvent, FollowGrowth } from "@/types/channel/analytics";

export function useCreatorFollowGrowth(creatorId: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery<FollowGrowth>({
    queryKey: QUERY_KEYS.channel.analyticsFollowGrowth(creatorId),
    queryFn: async () => {
      const since = new Date(Date.now() - ANALYTICS_FOLLOW_WINDOW_MS).toISOString();
      const { data, error, count } = await supabase
        .from("viewer_creator_relation")
        .select("viewer_id, followed_at", { count: "exact" })
        .eq("creator_id", creatorId)
        .gte("followed_at", since)
        .order("followed_at", { ascending: false })
        .limit(ANALYTICS_FOLLOW_LOG_LIMIT);

      if (error) {
        console.error("팔로우 증가 조회 실패", error);
        throw error;
      }

      const events: AnalyticsLogEvent[] = (data ?? [])
        .filter((row): row is { viewer_id: string; followed_at: string } =>
          Boolean(row.followed_at),
        )
        .map((row) => ({ id: row.viewer_id, type: "follow", at: row.followed_at }));

      return { count: count ?? events.length, events };
    },
    enabled: Boolean(creatorId),
    refetchInterval: ANALYTICS_FOLLOW_POLL_MS,
  });
}
