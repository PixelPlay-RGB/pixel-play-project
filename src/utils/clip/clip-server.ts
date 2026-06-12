// 클립 디테일의 서버 로더 — layout(generateMetadata)과 page가 같은 요청에서 중복
// 조회하지 않도록 React cache로 감싼다(live/[creatorId] layout의 로더 패턴).

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapLiveClipRowToLiveClip, type LiveClip, type LiveClipRow } from "@/types/clip/clip";
import { isUuid } from "@/utils/common/uuid";

export const LIVE_CLIP_SELECT =
  "id, creator_id, broadcast_id, clipper_user_id, title, duration_seconds, crop_x_fraction, status, storage_path, thumbnail_path, error_reason, claimed_at, view_count, created_at" as const;

// anon 서버 클라이언트 + RLS — ready 클립만 조회된다(미완성/실패는 notFound 처리).
export const getLiveClip = cache(async (clipId: string): Promise<LiveClip | null> => {
  if (!clipId || !isUuid(clipId)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("live_clip")
    .select(LIVE_CLIP_SELECT)
    .eq("id", clipId)
    .eq("status", "ready")
    .maybeSingle<LiveClipRow>();

  if (error) {
    console.error("클립 조회 실패", error);
    return null;
  }

  return data ? mapLiveClipRowToLiveClip(data) : null;
});
