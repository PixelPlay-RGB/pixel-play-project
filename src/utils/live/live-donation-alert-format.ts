// OBS 후원 알림 오버레이의 표시 문구를 포맷합니다.
import { LIVE_OVERLAY_DEFAULT_VIEWER_NAME } from "@/constants/live/live-overlay";

export function formatDonationDonorLabel(donorName: string | undefined) {
  const normalizedDonorName = donorName?.trim();

  if (!normalizedDonorName) {
    return `${LIVE_OVERLAY_DEFAULT_VIEWER_NAME}님`;
  }

  return normalizedDonorName.endsWith("님") ? normalizedDonorName : `${normalizedDonorName}님`;
}
