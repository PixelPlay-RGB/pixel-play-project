// 알림음 미리듣기·재생을 위한 클라이언트 유틸입니다.

import { DONATION_ALERT_SOUND_OPTIONS } from "@/constants/channel/donation";

// 선택한 알림음을 주어진 볼륨(0~100)으로 재생합니다. 파일이 없으면 조용히 무시합니다.
export function playDonationSound(soundKey: string, volume: number): void {
  if (typeof window === "undefined") {
    return;
  }

  const sound = DONATION_ALERT_SOUND_OPTIONS.find((option) => option.value === soundKey);

  if (!sound) {
    return;
  }

  const audio = new Audio(sound.src);
  audio.volume = Math.min(Math.max(volume / 100, 0), 1);
  void audio.play().catch(() => {
    // 알림음 파일이 아직 없는 경우 등 재생 실패는 무시합니다.
  });
}
