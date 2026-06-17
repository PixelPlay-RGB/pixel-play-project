// OBS 채팅 오버레이에서 사용하는 타입을 정의합니다.
import type { LiveBroadcastSummary, LiveMessageRow, LiveSenderRole } from "@/types/live/live";

export interface LiveChatOverlayMessage {
  id: LiveMessageRow["id"];
  creatorId?: LiveBroadcastSummary["creatorId"];
  kind: "chat" | "donation";
  author: string;
  content: LiveMessageRow["content"];
  createdAt: LiveMessageRow["created_at"];
  amount?: number | null;
  isSubscriber?: boolean;
  subscriptionTotalMonths?: number | null;
  tone?: "brand" | "live" | "muted" | "default";
  // 동시에 보유한 역할들(시청 채팅과 같은 다중 뱃지) — deriveSenderRoles로 합성.
  roles?: Exclude<LiveSenderRole, "viewer">[];
  // 단일 역할(구독 기능 호환) — 구독 N개월 티콘 판정 보조. roles 와 함께 보존한다.
  role?: "creator" | "donor" | "subscriber";
}

export interface LiveChatOverlayItem {
  type: "message";
  message: LiveChatOverlayMessage;
}

export interface LiveChatOverlaySnapshot {
  broadcast: LiveBroadcastSummary | null;
  donationMessageEnabled: boolean;
  donationAmountVisible: boolean;
  subscriptionBadgeCustomMonths: number[];
  subscriptionBadgeVersion: string | null;
  items: LiveChatOverlayItem[];
}
