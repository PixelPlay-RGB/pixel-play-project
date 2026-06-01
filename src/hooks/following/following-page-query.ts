"use client";
// 팔로잉 채널 페이지 전용 RPC 조회 함수를 제공합니다.

import { createClient } from "@/lib/supabase/client";
import type { FollowingChannelPageSnapshot } from "@/types/following/following-page";
import { parseFollowingChannelPageSnapshot } from "@/utils/following/following-page";

interface FetchFollowingChannelPageParams {
  limit: number;
  offset: number;
}

// 개인화(팔로잉 목록)는 RPC 내부에서 auth.uid()로 계산하므로 viewerId를 전달하지 않습니다.
export async function fetchFollowingChannelPage({
  limit,
  offset,
}: FetchFollowingChannelPageParams): Promise<FollowingChannelPageSnapshot> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_following_channel_page", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("팔로잉 채널 페이지 조회 실패", error);
    throw error;
  }

  return parseFollowingChannelPageSnapshot(data);
}
