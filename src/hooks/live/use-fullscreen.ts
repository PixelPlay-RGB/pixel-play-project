"use client";
// 지정한 컨테이너의 전체화면 토글과 현재 전체화면 상태를 관리합니다.
// iOS/구 Safari는 표준 API 대신 webkit 프리픽스만 지원하거나 Element 전체화면 자체를 막아
// 동기 throw를 던질 수 있어 모든 호출을 방어한다.

import { useCallback, useEffect, useRef, useState } from "react";

interface WebkitFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface WebkitFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

function getFullscreenElement(): Element | null {
  const doc = document as WebkitFullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

// requestFullscreen 부재(iOS) 또는 동기 throw를 모두 거부 Promise로 정규화한다.
function requestFullscreen(element: WebkitFullscreenElement): Promise<void> {
  const request = element.requestFullscreen ?? element.webkitRequestFullscreen;
  if (!request) {
    return Promise.reject(new Error("전체화면을 지원하지 않는 브라우저입니다."));
  }
  try {
    return Promise.resolve(request.call(element));
  } catch (error) {
    return Promise.reject(error);
  }
}

function exitFullscreen(): Promise<void> {
  const doc = document as WebkitFullscreenDocument;
  const exit = document.exitFullscreen ?? doc.webkitExitFullscreen;
  if (!exit) return Promise.resolve();
  try {
    return Promise.resolve(exit.call(document));
  } catch (error) {
    return Promise.reject(error);
  }
}

export function useFullscreen<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(getFullscreenElement() === containerRef.current);
    }

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;

    // 우리 컨테이너가 전체화면일 때만 종료한다. 다른 요소가 전체화면이면 우리 것으로 전환된다.
    if (getFullscreenElement() === element) {
      void exitFullscreen().catch((error) => {
        console.error("전체화면 종료 실패", error);
      });
      return;
    }

    void requestFullscreen(element).catch((error) => {
      console.error("전체화면 전환 실패", error);
    });
  }, []);

  return { containerRef, isFullscreen, toggleFullscreen };
}
