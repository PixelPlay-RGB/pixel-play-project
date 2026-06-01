// 라이브 페이지의 Server Component 데이터 조회를 담당합니다.
import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LiveHeroItem } from "@/types/live/live";
import { parseLiveHeroItem } from "@/utils/live/live-list";

export async function getLiveHero(): Promise<LiveHeroItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_live_hero");

  if (error) {
    console.error("라이브 Hero 조회 실패", error);
    return null;
  }

  try {
    return parseLiveHeroItem(data);
  } catch (parseError) {
    console.error("라이브 Hero 응답 파싱 실패", parseError);
    return null;
  }
}
