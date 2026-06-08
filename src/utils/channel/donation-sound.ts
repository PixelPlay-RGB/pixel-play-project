// 알림음 미리듣기·재생을 위한 클라이언트 유틸입니다.
// OBS 브라우저 소스에서 Web Audio(AudioContext)는 첫 재생 후 suspend되는 문제가 있어,
// 매 후원마다 안정적으로 재생되는 HTMLAudioElement를 사용합니다.
// (HTMLAudio는 볼륨 상한이 1.0이라 음원별 보정 게인은 "감쇠"까지만 적용됩니다.)

import {
  DONATION_ALERT_SOUND_MAX_MS,
  DONATION_ALERT_SOUND_OPTIONS,
} from "@/constants/channel/donation";

const FADE_OUT_MS = 220;
const FADE_TICK_MS = 20;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// 선택한 알림음을 주어진 볼륨(0~100)으로 재생합니다.
// - 음원별 보정 게인으로 체감 음량을 맞추되, HTMLAudio 한계로 1.0을 넘기진 못합니다(감쇠 위주).
// - DONATION_ALERT_SOUND_MAX_MS로 재생 길이를 통일하고, 끝나면(또는 실패하면) onEnd를 호출합니다.
export function playDonationSound(soundKey: string, volume: number, onEnd?: () => void): void {
  if (typeof window === "undefined") {
    onEnd?.();
    return;
  }

  const sound = DONATION_ALERT_SOUND_OPTIONS.find((option) => option.value === soundKey);

  let settled = false;
  let cutTimer = 0;
  let fadeTimer = 0;

  const cleanup = () => {
    window.clearTimeout(cutTimer);
    window.clearInterval(fadeTimer);
  };

  const finish = () => {
    if (settled) {
      return;
    }
    settled = true;
    cleanup();
    onEnd?.();
  };

  if (!sound) {
    finish();
    return;
  }

  const targetVolume = clamp((volume / 100) * sound.gain, 0, 1);
  const audio = new Audio(sound.src);
  audio.volume = targetVolume;
  audio.onended = finish;
  audio.onerror = finish;

  const fadeOutAndStop = () => {
    const steps = Math.max(Math.ceil(FADE_OUT_MS / FADE_TICK_MS), 1);
    const decrement = targetVolume / steps;

    fadeTimer = window.setInterval(() => {
      const next = audio.volume - decrement;

      if (next <= 0.01) {
        audio.volume = 0;
        audio.pause();
        finish();
        return;
      }

      audio.volume = next;
    }, FADE_TICK_MS);
  };

  void audio
    .play()
    .then(() => {
      cutTimer = window.setTimeout(fadeOutAndStop, DONATION_ALERT_SOUND_MAX_MS);
    })
    .catch(finish);
}
