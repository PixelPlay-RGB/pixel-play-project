// 채널 이모지 서버 로더 — 스튜디오 페이지(서버 컴포넌트)에서 초기 목록을 admin RPC로 읽는다.
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";
import { parseChannelEmojis } from "@/utils/channel/channel-emoji";

export async function getChannelEmojis(creatorId: string): Promise<ChannelEmoji[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_channel_emojis", { p_creator_id: creatorId });

  if (error) {
    console.error("채널 이모지 목록 조회 실패", error);
    return [];
  }

  return parseChannelEmojis(data);
}
