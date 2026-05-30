// OBS 채팅 오버레이에서 사용하는 타입을 정의합니다.
import type { LiveBroadcastSummary, LiveMessageRow } from "@/types/live/live";

export interface LiveChatOverlayMessage {
  id: LiveMessageRow["id"];
  author: string;
  content: LiveMessageRow["content"];
  createdAt: LiveMessageRow["created_at"];
  tone?: "brand" | "live" | "muted" | "default";
  role?: "creator";
}

export interface LiveChatOverlayItem {
  type: "message";
  message: LiveChatOverlayMessage;
}

export interface LiveChatOverlaySnapshot {
  broadcast: LiveBroadcastSummary | null;
  items: LiveChatOverlayItem[];
}
