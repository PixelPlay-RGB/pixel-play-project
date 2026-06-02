"use client";
// 브라우저 네이티브 Web Speech API(TTS)를 SSR 안전하게 감싸는 훅입니다.

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeakOptions {
  rate?: number;
  volume?: number;
  lang?: string;
  voiceURI?: string;
  onEnd?: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

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
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    const synth = synthRef.current;

    if (!synth || !text.trim()) {
      options?.onEnd?.();
      return;
    }

    const runSpeak = () => {
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang ?? "ko-KR";
      utterance.volume = clamp(options?.volume ?? 1, 0, 1);
      utterance.rate = clamp(options?.rate ?? 1, 0.5, 2);

      if (options?.voiceURI) {
        const matched = synth.getVoices().find((item) => item.voiceURI === options.voiceURI);
        if (matched) {
          utterance.voice = matched;
        }
      }

      if (options?.onEnd) {
        utterance.onend = options.onEnd;
        utterance.onerror = options.onEnd;
      }

      synth.speak(utterance);
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
