"use client";
// 브라우저 네이티브 Web Speech API(TTS)를 SSR 안전하게 감싸는 훅입니다.

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeakOptions {
  rate?: number;
  volume?: number;
  lang?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSupported(true);
    }

    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    const synth = synthRef.current;

    if (!synth || !text.trim()) {
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang ?? "ko-KR";
    utterance.rate = clamp(options?.rate ?? 1, 0.5, 2);
    utterance.volume = clamp(options?.volume ?? 1, 0, 1);

    synth.speak(utterance);
  }, []);

  const cancel = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  return { isSupported, speak, cancel };
}
