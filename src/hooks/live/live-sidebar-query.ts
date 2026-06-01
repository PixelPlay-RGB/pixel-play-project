"use client";
// 라이브 Sidebar 전용 RPC 조회 함수를 제공합니다.

import { createClient } from "@/lib/supabase/client";
import type { FollowingChannelSnapshot, LivePopularKeywordSnapshot } from "@/types/live/live";
import {
  parseFollowingChannelSnapshot,
  parseLivePopularKeywordSnapshot,
} from "@/utils/live/live-sidebar";

interface FetchFollowingChannelSnapshotParams {
  limit: number;
  offset: number;
}

export async function fetchLivePopularKeywordSnapshot(
  limit: number,
): Promise<LivePopularKeywordSnapshot> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_live_popular_keywords", {
    p_limit: limit,
  });

  if (error) {
    console.error("라이브 인기 키워드 조회 실패", error);
    throw error;
  }

  return parseLivePopularKeywordSnapshot(data);
}

export async function fetchFollowingChannelSnapshot({
  limit,
  offset,
}: FetchFollowingChannelSnapshotParams): Promise<FollowingChannelSnapshot> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_following_channel_list", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("팔로잉 채널 조회 실패", error);
    throw error;
  }

  return parseFollowingChannelSnapshot(data);
}
