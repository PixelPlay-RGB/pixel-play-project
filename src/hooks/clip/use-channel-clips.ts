"use client";
// 채널의 완성(ready) 클립 목록을 정렬·기간 필터로 조회합니다. 생성/조회수는 actions/clip 경유.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { ClipPeriod, ClipSort, LiveClip, LiveClipRow } from "@/types/clip/clip";
import { LIVE_CLIP_LIST_COLUMNS, mapLiveClipRowToLiveClip } from "@/utils/clip/clip-row";

const EMPTY_CLIPS: LiveClip[] = [];

const PERIOD_HOURS: Record<Exclude<ClipPeriod, "all">, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

// 기간 필터의 하한 시각. 쿼리 키에는 절대 시각이 아닌 period를 넣어 캐시가 안정되게 한다.
function periodCutoffIso(period: ClipPeriod): string | null {
  if (period === "all") return null;
  return new Date(Date.now() - PERIOD_HOURS[period] * 60 * 60 * 1000).toISOString();
}

interface UseChannelClipsParams {
  sort: ClipSort;
  period?: ClipPeriod;
  limit: number;
}

export function useChannelClips(
  creatorId: string | null | undefined,
  { sort, period = "all", limit }: UseChannelClipsParams,
) {
  const supabase = useMemo(() => createClient(), []);

  const query = useQuery<LiveClip[]>({
    queryKey: QUERY_KEYS.clip.channel(creatorId ?? undefined, sort, period, limit),
    enabled: !!creatorId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!creatorId) throw new Error("creatorId is required");

      let builder = supabase
        .from("live_clip")
        .select(LIVE_CLIP_LIST_COLUMNS)
        .eq("creator_id", creatorId)
        .eq("status", "ready");

      const cutoff = periodCutoffIso(period);
      if (cutoff) {
        builder = builder.gte("created_at", cutoff);
      }

      // 인기순 동률은 최신 우선 — live_clip_channel_popular_idx 정렬과 동일.
      builder =
        sort === "popular"
          ? builder
              .order("view_count", { ascending: false })
              .order("created_at", { ascending: false })
          : builder.order("created_at", { ascending: false });

      const { data, error } = await builder.limit(limit).returns<LiveClipRow[]>();

      if (error) throw error;

      return (data ?? []).map(mapLiveClipRowToLiveClip);
    },
  });

  return {
    clips: query.data ?? EMPTY_CLIPS,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
