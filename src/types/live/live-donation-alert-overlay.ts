// OBS 후원 알림 오버레이에서 사용하는 타입을 정의합니다.
import type { DonationRow, LiveBroadcastRow, LiveMessageRow } from "@/types/live/live";

export interface LiveDonationAlertOverlayData {
  id: DonationRow["id"] | LiveMessageRow["id"];
  creatorName: string;
  donorName: string;
  // 금액 표시(amountVisible)가 꺼져 있으면 RPC에서 null로 내려와 화면에서 금액을 숨깁니다.
  amount: DonationRow["amount"] | null;
  message: DonationRow["message"];
  createdAt: DonationRow["created_at"] | LiveMessageRow["created_at"];
}

// 후원 알림 오버레이가 재생할 알림음/TTS 설정입니다.
export interface LiveDonationAlertAudioSettings {
  alertSoundEnabled: boolean;
  alertSoundKey: string;
  alertVolume: number;
  ttsEnabled: boolean;
  ttsRate: number;
  ttsVolume: number;
  ttsVoiceUri: string;
  amountVisible: boolean;
}

export interface LiveDonationAlertOverlaySnapshot {
  creatorId: LiveBroadcastRow["creator_id"];
  broadcastId: LiveBroadcastRow["id"] | null;
  creatorName: string;
  alertVisibleMs: number;
  audio: LiveDonationAlertAudioSettings;
  donation: LiveDonationAlertOverlayData | null;
}
