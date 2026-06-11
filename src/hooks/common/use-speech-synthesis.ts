"use client";
// 브라우저 네이티브 Web Speech API(TTS)를 SSR 안전하게 감싸는 훅입니다.

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeakOptions {
  rate?: number;
  volume?: number;
  lang?: string;
  voiceURI?: string;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent["error"]) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function findSpeechVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  voiceURI?: string,
): SpeechSynthesisVoice | null {
  if (voiceURI) {
    const matched = voices.find((item) => item.voiceURI === voiceURI);

    if (matched) {
      return matched;
    }
  }

  const normalizedLang = lang.toLowerCase();
  const languagePrefix = normalizedLang.split("-")[0];

  return (
    voices.find((item) => item.localService && item.lang.toLowerCase() === normalizedLang) ??
    voices.find(
      (item) => item.localService && item.lang.toLowerCase().startsWith(languagePrefix),
    ) ??
    voices.find((item) => item.lang.toLowerCase() === normalizedLang) ??
    voices.find((item) => item.lang.toLowerCase().startsWith(languagePrefix)) ??
    null
  );
}

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    synthRef.current = synth;

    const loadVoices = () => {
      setVoices(synth.getVoices());
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(true);
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);

    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      synth.cancel();
      utteranceRef.current = null;
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    const synth = synthRef.current;

    if (!synth || !text.trim()) {
      options?.onEnd?.();
      return;
    }

    const startUtterance = () => {
      const lang = options?.lang ?? "ko-KR";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.volume = clamp(options?.volume ?? 1, 0, 1);
      utterance.rate = clamp(options?.rate ?? 1, 0.5, 2);

      const matched = findSpeechVoice(synth.getVoices(), lang, options?.voiceURI);
      if (matched) {
        utterance.voice = matched;
      }

      const clearUtterance = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
        }
      };

      utterance.onend = () => {
        clearUtterance();
        options?.onEnd?.();
      };

      utterance.onerror = (event) => {
        clearUtterance();

        // 사용자 상호작용 전 자동재생 정책 차단(주로 일반 브라우저 탭에서 오버레이를 연 경우).
        // OBS 브라우저 소스는 자동재생이 허용되어 해당 없음 — 다음 클릭/키 입력에서 한 번 재시도한다.
        if (event.error === "not-allowed") {
          console.warn("TTS가 자동재생 정책으로 차단됨 — 다음 상호작용에서 재시도합니다.");
          const retry = () => {
            window.removeEventListener("pointerdown", retry);
            window.removeEventListener("keydown", retry);
            runSpeak();
          };
          window.addEventListener("pointerdown", retry, { once: true });
          window.addEventListener("keydown", retry, { once: true });
        } else {
          console.warn("TTS 재생 실패", event.error);
        }

        options?.onError?.(event.error);
        options?.onEnd?.();
      };

      utteranceRef.current = utterance;
      synth.resume();
      synth.speak(utterance);
      // macOS Chrome/Safari는 synthesis가 paused 상태로 남아 speak가 시작되지 않는 사례가 있어,
      // speak를 큐에 넣은 뒤에도 한 번 더 깨운다(이미 재생 중이면 no-op).
      synth.resume();
    };

    const runSpeak = () => {
      // macOS에서 cancel() 직후의 speak()가 통째로 무시되는 버그가 있어,
      // 재생 중일 때만 끊고 큐가 비워질 시간을 잠깐 둔 뒤 시작한다.
      if (synth.speaking || synth.pending) {
        synth.cancel();
        window.setTimeout(startUtterance, 60);
        return;
      }

      startUtterance();
    };

    // 특정 음성을 요청했는데 음성 목록이 아직 로드되지 않았다면(페이지 로드 직후 등),
    // 로드를 기다렸다가 말해서 설정한 음성이 아닌 기본 음성으로 빠지는 문제를 막습니다.
    if (options?.voiceURI && synth.getVoices().length === 0) {
      let started = false;
      const start = () => {
        if (started) {
          return;
        }
        started = true;
        synth.removeEventListener("voiceschanged", start);
        window.clearTimeout(fallbackTimer);
        runSpeak();
      };

      const fallbackTimer = window.setTimeout(start, 1500);
      synth.addEventListener("voiceschanged", start);
      return;
    }

    runSpeak();
  }, []);

  const cancel = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  return { isSupported, voices, speak, cancel };
}
