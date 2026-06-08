"use client";
// 시청 중인 라이브 방송에 주기적으로 하트비트를 보내 current_viewer_count 집계에 참여합니다.
// 로그인·익명 시청자 모두 집계되며(서버가 로그인 시 user id, 아니면 익명 키 채택),
// 진입/주기/복귀 시 하트비트, 이탈 시 즉시 제거합니다.

import { useEffect } from "react";
import {
  leaveLiveViewerPresenceAction,
  syncLiveViewerPresenceAction,
} from "@/actions/live/live";

const HEARTBEAT_INTERVAL_MS = 10_000;
const ANON_VIEWER_KEY_STORAGE = "live-anon-viewer-key";

// sessionStorage가 막힌 환경(프라이빗 모드 등)을 위한 비영속 폴백 키.
let inMemoryAnonKey: string | null = null;

function generateAnonKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // 비보안(non-HTTPS) 컨텍스트 등 crypto.randomUUID 미지원 시 폴백.
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// 익명 시청자 식별용 키 — 탭 세션 동안 안정적으로 유지해 같은 시청자가 중복 집계되지 않게 한다.
function getAnonViewerKey(): string {
  try {
    const stored = sessionStorage.getItem(ANON_VIEWER_KEY_STORAGE);
    if (stored) return stored;

    const generated = generateAnonKey();
    sessionStorage.setItem(ANON_VIEWER_KEY_STORAGE, generated);
    return generated;
  } catch {
    // sessionStorage 접근 불가 — 모듈 메모리에 한 번 생성해 세션 동안 재사용.
    if (!inMemoryAnonKey) inMemoryAnonKey = generateAnonKey();
    return inMemoryAnonKey;
  }
}

export function useLiveViewerPresence(broadcastId: string | null | undefined) {
  useEffect(() => {
    if (!broadcastId) return;

    const anonViewerKey = getAnonViewerKey();

    const sendHeartbeat = () => {
      void syncLiveViewerPresenceAction(broadcastId, anonViewerKey);
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void leaveLiveViewerPresenceAction(broadcastId, anonViewerKey);
    };
  }, [broadcastId]);
}
