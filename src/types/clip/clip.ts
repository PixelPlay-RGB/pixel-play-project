// 라이브 클립 도메인 타입을 정의합니다.

import type { GenericTables } from "@/types/common/supabase.types";

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
