// OBS 후원 알림 오버레이에서 사용하는 타입을 정의합니다.
import type { DonationRow, LiveBroadcastRow, LiveMessageRow } from "@/types/live/live";

export interface LiveDonationAlertOverlayData {
  id: DonationRow["id"] | LiveMessageRow["id"];
  creatorName: string;
  donorName: string;
  amount: DonationRow["amount"];
  message: DonationRow["message"];
  createdAt: DonationRow["created_at"] | LiveMessageRow["created_at"];
}

export interface LiveDonationAlertOverlaySnapshot {
  creatorId: LiveBroadcastRow["creator_id"];
  broadcastId: LiveBroadcastRow["id"] | null;
  creatorName: string;
  alertVisibleMs: number;
  donation: LiveDonationAlertOverlayData | null;
}
