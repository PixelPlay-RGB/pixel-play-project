"use client";
// 라이브 목록 RPC 조회 함수를 제공합니다.

import { createClient } from "@/lib/supabase/client";
import type { LiveListFilter, LiveListSnapshot, LiveListSort } from "@/types/live/live";
import { parseLiveListSnapshot } from "@/utils/live/live-list";

interface FetchLiveListSnapshotParams {
  filter: LiveListFilter;
  sort: LiveListSort;
  viewerId?: string;
  limit: number;
}

export async function fetchLiveListSnapshot({
  filter,
  sort,
  viewerId,
  limit,
}: FetchLiveListSnapshotParams): Promise<LiveListSnapshot> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_live_list", {
    p_filter: filter,
    p_sort: sort,
    p_viewer_id: viewerId,
    p_query: undefined,
    p_limit: limit,
    p_offset: 0,
  });

  if (error) {
    console.error("라이브 목록 조회 실패", error);
    throw error;
  }

  return parseLiveListSnapshot(data);
}
