"use client";
// 채널(크리에이터) 표시 프로필(닉네임·아바타)을 creatorId로 조회한다 — 채팅 이모지 피커의 채널 탭 표시용.
// user 테이블은 authenticated 읽기(RLS)라 로그인 상태에서만 의미가 있어, 호출부가 enabled로 게이트한다.

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";

export interface ChannelProfile {
  name: string | null;
  avatarUrl: string | null;
}

async function fetchChannelProfile(creatorId: string): Promise<ChannelProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user")
    .select("nickname, photo_url")
    .eq("id", creatorId)
    .maybeSingle();

  if (error) {
    console.error("채널 프로필 조회 실패", error);
    throw error;
  }

  return { name: data?.nickname ?? null, avatarUrl: data?.photo_url ?? null };
}

// creatorId가 채널 주인(피커 채널 탭 표시정보의 진실 소스). 본인이든 향후 구독자든 채널 이름이 맞다.
// 5분 캐싱 — 닉네임·사진은 자주 안 바뀐다.
export function useChannelProfile(creatorId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.channel.profile(creatorId),
    queryFn: () => fetchChannelProfile(creatorId as string),
    enabled: Boolean(creatorId) && enabled,
    staleTime: 1000 * 60 * 5,
  });
}
