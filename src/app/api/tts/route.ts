// 후원 알림 TTS 합성 API — Google Cloud Text-to-Speech로 mp3를 만들어 돌려줍니다.
// Web Speech(OS 음성 엔진)는 OBS 브라우저 소스에서 무음이라, 효과음과 같은 <audio> 경로로
// 재생되도록 서버에서 합성합니다. 공급자 교체가 쉽도록 합성 함수를 분리해 둡니다.

import {
  DONATION_TTS_TEXT_MAX,
  DONATION_TTS_VOICE_DEFAULT,
  DONATION_TTS_VOICE_OPTIONS,
} from "@/constants/channel/donation";

const GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";
const TTS_RATE_MIN = 0.5;
const TTS_RATE_MAX = 2;
// 서버리스 인스턴스 생존 동안 같은 (음성·속도·문구) 합성을 재사용하는 best-effort 캐시.
const TTS_CACHE_LIMIT = 50;
const ttsCache = new Map<string, ArrayBuffer>();

const ALLOWED_VOICE_NAMES = new Set<string>(
  DONATION_TTS_VOICE_OPTIONS.map((option) => option.value),
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readRequestParams(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { text, voiceName, rate } = body as Record<string, unknown>;
  const trimmedText = typeof text === "string" ? text.trim() : "";

  if (!trimmedText || trimmedText.length > DONATION_TTS_TEXT_MAX) {
    return null;
  }

  return {
    text: trimmedText,
    // 화이트리스트 밖 값(예: 과거 Web Speech voiceURI 저장값)은 기본 음성으로 폴백한다.
    voiceName:
      typeof voiceName === "string" && ALLOWED_VOICE_NAMES.has(voiceName)
        ? voiceName
        : DONATION_TTS_VOICE_DEFAULT,
    rate: clamp(
      typeof rate === "number" && Number.isFinite(rate) ? rate : 1,
      TTS_RATE_MIN,
      TTS_RATE_MAX,
    ),
  };
}

async function synthesizeWithGoogle(
  apiKey: string,
  params: { text: string; voiceName: string; rate: number },
): Promise<ArrayBuffer> {
  const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: params.text },
      voice: { languageCode: "ko-KR", name: params.voiceName },
      audioConfig: { audioEncoding: "MP3", speakingRate: params.rate },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google TTS 합성 실패 (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { audioContent?: string };

  if (!payload.audioContent) {
    throw new Error("Google TTS 응답에 audioContent가 없습니다.");
  }

  const buffer = Buffer.from(payload.audioContent, "base64");
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "tts_not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const params = readRequestParams(body);

  if (!params) {
    return Response.json({ error: "invalid_tts_request" }, { status: 400 });
  }

  const cacheKey = `${params.voiceName}:${params.rate}:${params.text}`;
  let audio = ttsCache.get(cacheKey);

  if (!audio) {
    try {
      audio = await synthesizeWithGoogle(apiKey, params);
    } catch (error) {
      console.error("후원 TTS 합성 실패", error);
      return Response.json({ error: "tts_synthesis_failed" }, { status: 502 });
    }

    // 캐시 상한 유지 — 가장 오래된 항목부터 비운다(Map은 삽입 순서를 보존).
    if (ttsCache.size >= TTS_CACHE_LIMIT) {
      const oldestKey = ttsCache.keys().next().value;
      if (oldestKey !== undefined) {
        ttsCache.delete(oldestKey);
      }
    }
    ttsCache.set(cacheKey, audio);
  }

  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
