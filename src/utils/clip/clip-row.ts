// 라이브 클립 행(DB row)을 도메인 모델로 변환하는 순수 로직과 조회 컬럼 상수를 제공합니다.

import type { LiveClip, LiveClipRow } from "@/types/clip/clip";
import { getUserMediaPublicUrl } from "@/utils/storage/user-media";

// 목록/디테일 조회가 mapLiveClipRowToLiveClip이 실제로 읽는 컬럼만 선택하도록 모은 단일 소스
// (use-channel-clips·clip-server 공용 — 과대 선택/중복 방지).
export const LIVE_CLIP_LIST_COLUMNS =
  "id, creator_id, clipper_user_id, title, duration_seconds, status, storage_path, thumbnail_path, view_count, created_at" as const;

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
