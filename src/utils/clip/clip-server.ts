// 클립 디테일의 서버 로더 — layout(generateMetadata)과 page가 같은 요청에서 중복
// 조회하지 않도록 React cache로 감싼다(live/[creatorId] layout의 로더 패턴).

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { LiveClip, LiveClipRow } from "@/types/clip/clip";
import { LIVE_CLIP_LIST_COLUMNS, mapLiveClipRowToLiveClip } from "@/utils/clip/clip-row";
import { isUuid } from "@/utils/common/uuid";

// anon 서버 클라이언트 + RLS — ready 클립만 조회된다(미완성/실패는 notFound 처리).
export const getLiveClip = cache(async (clipId: string): Promise<LiveClip | null> => {
  if (!clipId || !isUuid(clipId)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("live_clip")
    .select(LIVE_CLIP_LIST_COLUMNS)
    .eq("id", clipId)
    .eq("status", "ready")
    .maybeSingle<LiveClipRow>();

  if (error) {
    console.error("클립 조회 실패", error);
    return null;
  }

  return data ? mapLiveClipRowToLiveClip(data) : null;
});
