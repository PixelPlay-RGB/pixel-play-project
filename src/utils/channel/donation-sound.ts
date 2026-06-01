// 알림음 미리듣기·재생을 위한 클라이언트 유틸입니다.
// Web Audio API(GainNode)로 음원별 음량을 정규화하고, 재생 길이를 통일(페이드아웃)합니다.

import {
  DONATION_ALERT_SOUND_MAX_MS,
  DONATION_ALERT_SOUND_OPTIONS,
} from "@/constants/channel/donation";

const FADE_OUT_SEC = 0.22;
const MAX_GAIN = 8;

let sharedContext: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) {
    return null;
  }

  if (!sharedContext) {
    sharedContext = new AudioContext();
  }

  return sharedContext;
}

// 선택한 알림음을 주어진 볼륨(0~100)으로 재생합니다.
// - 음원별 보정 게인으로 체감 음량을 맞추고, DONATION_ALERT_SOUND_MAX_MS로 재생 길이를 통일합니다.
// - 재생이 끝나면(또는 실패하면) onEnd를 호출해 후속 동작(TTS 등)을 이어갈 수 있습니다.
export function playDonationSound(soundKey: string, volume: number, onEnd?: () => void): void {
  const sound = DONATION_ALERT_SOUND_OPTIONS.find((option) => option.value === soundKey);
  const context = getAudioContext();

  let settled = false;
  const finish = () => {
    if (settled) {
      return;
    }
    settled = true;
    onEnd?.();
  };

  if (!sound || !context) {
    finish();
    return;
  }

  const baseVolume = Math.min(Math.max(volume / 100, 0), 1);
  const targetGain = Math.min(Math.max(baseVolume * sound.gain, 0), MAX_GAIN);

  void (async () => {
    try {
      // 자동재생 정책으로 정지돼 있으면 재생(사용자 클릭 컨텍스트)에서 다시 활성화합니다.
      if (context.state === "suspended") {
        await context.resume();
      }

      let buffer = bufferCache.get(sound.value);
      if (!buffer) {
        const response = await fetch(sound.src);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await context.decodeAudioData(arrayBuffer);
        bufferCache.set(sound.value, buffer);
      }

      const source = context.createBufferSource();
      source.buffer = buffer;

      const gainNode = context.createGain();
      const now = context.currentTime;
      const playSeconds = Math.min(buffer.duration, DONATION_ALERT_SOUND_MAX_MS / 1000);
      const fadeStart = Math.max(playSeconds - FADE_OUT_SEC, 0);

      gainNode.gain.setValueAtTime(targetGain, now);
      gainNode.gain.setValueAtTime(targetGain, now + fadeStart);
      gainNode.gain.linearRampToValueAtTime(0.0001, now + playSeconds);

      source.connect(gainNode).connect(context.destination);
      source.onended = finish;
      source.start(now);
      source.stop(now + playSeconds + 0.02);
    } catch {
      finish();
    }
  })();
}
