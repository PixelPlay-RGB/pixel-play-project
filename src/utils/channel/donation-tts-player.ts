// 서버 합성(/api/tts) mp3로 후원 TTS를 재생하는 클라이언트 유틸입니다.
// 효과음(donation-sound)과 같은 HTMLAudioElement 경로라 OBS 캡처·플랫폼과 무관하게 송출에 실립니다.
// 재생 순서(효과음 종료 → TTS)는 호출자 체인이 소유하며, 실패해도 onEnd는 반드시 한 번 호출됩니다.

interface PlayDonationTtsOptions {
  voiceName?: string;
  rate?: number;
  // 0~1. HTMLAudio 볼륨에 그대로 적용한다.
  volume?: number;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

// 같은 (음성·속도·문구) 합성 결과를 재사용하는 blob URL 캐시 — 미리듣기 연타·반복 테스트 대응.
const TTS_BLOB_CACHE_LIMIT = 20;
const ttsBlobUrlCache = new Map<string, string>();

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

async function resolveTtsBlobUrl(
  text: string,
  voiceName: string | undefined,
  rate: number,
): Promise<string> {
  const cacheKey = `${voiceName ?? ""}:${rate}:${text}`;
  const cached = ttsBlobUrlCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceName, rate }),
  });

  if (!response.ok) {
    throw new Error(`후원 TTS 합성 요청 실패 (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // 캐시 상한 유지 — 가장 오래된 blob URL은 해제 후 비운다(Map은 삽입 순서를 보존).
  if (ttsBlobUrlCache.size >= TTS_BLOB_CACHE_LIMIT) {
    const oldestKey = ttsBlobUrlCache.keys().next().value;
    if (oldestKey !== undefined) {
      const oldestUrl = ttsBlobUrlCache.get(oldestKey);
      if (oldestUrl) {
        URL.revokeObjectURL(oldestUrl);
      }
      ttsBlobUrlCache.delete(oldestKey);
    }
  }
  ttsBlobUrlCache.set(cacheKey, url);

  return url;
}

// 후원 TTS를 재생합니다. 빈 문구면 즉시 onEnd를 호출합니다.
export function playDonationTts(text: string, options: PlayDonationTtsOptions = {}): void {
  if (typeof window === "undefined" || !text.trim()) {
    options.onEnd?.();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) {
      return;
    }
    settled = true;
    options.onEnd?.();
  };

  void (async () => {
    try {
      const url = await resolveTtsBlobUrl(text, options.voiceName, options.rate ?? 1);
      const audio = new Audio(url);
      audio.volume = clamp(options.volume ?? 1, 0, 1);
      audio.onended = finish;
      audio.onerror = () => {
        options.onError?.(new Error("후원 TTS 오디오 재생 실패"));
        finish();
      };

      await audio.play();
    } catch (error) {
      console.warn("후원 TTS 재생 실패", error);
      options.onError?.(error);
      finish();
    }
  })();
}
