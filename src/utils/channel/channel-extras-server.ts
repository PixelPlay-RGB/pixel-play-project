// 채널 홈용 서버 조회(Live Hero·배너). 실패해도 페이지는 렌더되도록 graceful.
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import type { ChannelBanner } from "@/types/channel/channel";
import type { LiveHeroItem } from "@/types/live/live";
import { parseChannelBanners } from "@/utils/channel/channel-parser";
import { parseLiveHeroItem } from "@/utils/live/live-list";

export async function getChannelLiveHero(creatorId: string): Promise<LiveHeroItem | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_channel_live_hero", { p_creator_id: creatorId });

  if (error) {
    console.error("채널 Live Hero 조회 실패", error);
    return null;
  }

  try {
    return parseLiveHeroItem(data as unknown);
  } catch (parseError) {
    console.error("채널 Live Hero 파싱 실패", parseError);
    return null;
  }
}

export async function getChannelBanners(creatorId: string): Promise<ChannelBanner[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_channel_banners", { p_creator_id: creatorId });

  if (error) {
    console.error("채널 배너 조회 실패", error);
    return [];
  }

  return parseChannelBanners(data);
}
