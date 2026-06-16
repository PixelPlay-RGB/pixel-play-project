"use client";
// 채널 이모지를 클라이언트에서 조회해 Sticker[] 형태로 돌려준다(채팅 피커·렌더러 공용).
// channel_emoji는 읽기 공개(RLS using true)라 RPC 없이 테이블을 바로 SELECT한다.

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { Sticker } from "@/types/sticker/sticker";
import { getChannelEmojiSrc } from "@/utils/channel/channel-emoji";

async function fetchChannelEmojiStickers(creatorId: string): Promise<Sticker[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("channel_emoji")
    .select("id, image_path, name, sort_order")
    .eq("creator_id", creatorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("채널 이모지 조회 실패", error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.name,
    src: getChannelEmojiSrc(row.image_path),
    isAnimated: false,
  }));
}

// creatorId가 없으면 비활성(공개 페이지 등). 5분 캐싱 — 등록/수정은 설정 페이지에서만 일어난다.
export function useChannelEmojiStickers(creatorId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.channel.emojis(creatorId),
    queryFn: () => fetchChannelEmojiStickers(creatorId as string),
    enabled: Boolean(creatorId),
    staleTime: 1000 * 60 * 5,
  });
}
