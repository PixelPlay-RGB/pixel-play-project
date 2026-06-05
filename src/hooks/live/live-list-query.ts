"use client";
// 라이브 목록 RPC 조회 함수를 제공합니다.

import { createClient } from "@/lib/supabase/client";
import type { LiveListFilter, LiveListSnapshot, LiveListSort } from "@/types/live/live";
import { parseLiveListSnapshot } from "@/utils/live/live-list";

interface FetchLiveListSnapshotParams {
  filter: LiveListFilter;
  sort: LiveListSort;
  limit: number;
  excludedLiveId?: string | null;
}

// 개인화(isFollowing/FOLLOWING)는 RPC 내부에서 auth.uid()로 계산하므로 viewerId를 전달하지 않습니다.
export async function fetchLiveListSnapshot({
  filter,
  sort,
  limit,
  excludedLiveId,
}: FetchLiveListSnapshotParams): Promise<LiveListSnapshot> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_live_list", {
    p_filter: filter,
    p_sort: sort,
    p_query: undefined,
    p_limit: limit,
    p_offset: 0,
    p_excluded_live_id: excludedLiveId ?? undefined,
  });

  if (error) {
    console.error("라이브 목록 조회 실패", error);
    throw error;
  }

  return parseLiveListSnapshot(data);
}
