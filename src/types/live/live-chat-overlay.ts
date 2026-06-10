// OBS 채팅 오버레이에서 사용하는 타입을 정의합니다.
import type { LiveBroadcastSummary, LiveMessageRow } from "@/types/live/live";

export interface LiveChatOverlayMessage {
  id: LiveMessageRow["id"];
  kind: "chat" | "donation";
  author: string;
  content: LiveMessageRow["content"];
  createdAt: LiveMessageRow["created_at"];
  amount?: number | null;
  tone?: "brand" | "live" | "muted" | "default";
  role?: "creator" | "donor";
}

export interface LiveChatOverlayItem {
  type: "message";
  message: LiveChatOverlayMessage;
}

export interface LiveChatOverlaySnapshot {
  broadcast: LiveBroadcastSummary | null;
  donationMessageEnabled: boolean;
  donationAmountVisible: boolean;
  items: LiveChatOverlayItem[];
}
