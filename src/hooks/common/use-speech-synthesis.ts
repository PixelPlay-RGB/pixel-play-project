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

    const runSpeak = () => {
      synth.cancel();

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
        console.warn("TTS 재생 실패", event.error);
        clearUtterance();
        options?.onError?.(event.error);
        options?.onEnd?.();
      };

      utteranceRef.current = utterance;
      synth.resume();
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
