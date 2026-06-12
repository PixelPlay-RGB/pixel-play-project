// 라이브 클립 도메인 타입과 행 매핑을 정의합니다.

import type { GenericTables } from "@/types/common/supabase.types";
import { getUserMediaPublicUrl } from "@/utils/storage/user-media";

export type LiveClipRow = GenericTables<"live_clip">;
export type LiveClipStatus = LiveClipRow["status"];

export type ClipSort = "popular" | "recent";
export type ClipPeriod = "all" | "24h" | "7d" | "30d";

export interface LiveClip {
  id: string;
  creatorId: string;
  clipperUserId: string;
  title: string;
  durationSeconds: number;
  status: LiveClipStatus;
  // ready 전에는 Storage 경로가 비어 있다 — 목록/디테일은 ready만 다루지만
  // 생성 직후 Realtime 구독에서는 pending/failed 행도 흐른다.
  videoUrl: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: string;
}

export function mapLiveClipRowToLiveClip(row: LiveClipRow): LiveClip {
  return {
    id: row.id,
    creatorId: row.creator_id,
    clipperUserId: row.clipper_user_id,
    title: row.title,
    durationSeconds: row.duration_seconds,
    status: row.status,
    videoUrl: row.storage_path ? getUserMediaPublicUrl(row.storage_path) : null,
    thumbnailUrl: row.thumbnail_path ? getUserMediaPublicUrl(row.thumbnail_path) : null,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}
