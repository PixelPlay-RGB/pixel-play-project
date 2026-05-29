// 라이브 도메인에서 공유하는 DB row와 표시 타입을 정의합니다.
import type { GenericTables } from "@/types/common/supabase.types";

export type LiveBroadcastRow = GenericTables<"live_broadcast">;
export type LiveMessageRow = GenericTables<"live_message">;
export type DonationRow = GenericTables<"donation">;
export type LiveOverlayKind = "chat" | "donation";

export interface LiveBroadcastSummary {
  id: LiveBroadcastRow["id"];
  title: LiveBroadcastRow["title"];
  creatorId: LiveBroadcastRow["creator_id"];
  currentViewerCount: LiveBroadcastRow["current_viewer_count"];
  startedAt: LiveBroadcastRow["started_at"];
}

export interface LiveOverlayRouteParams {
  creatorId: string;
  overlayKey: string;
}
