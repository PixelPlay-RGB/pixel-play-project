"use client";
// 시청 중인 라이브 방송에 주기적으로 하트비트를 보내 current_viewer_count 집계에 참여합니다.
// 로그인·익명 시청자 모두 집계되며(서버가 로그인이면 user id, 아니면 발급·검증한 익명 쿠키로 식별),
// 진입/주기/복귀 시 하트비트, 이탈 시 즉시 제거합니다. 익명 식별 키는 클라이언트가 만들지 않습니다.

import { useEffect } from "react";
import { leaveLiveViewerPresenceAction } from "@/actions/live/live";
import { LIVE_VIEWER_LEAVE_API_PATH, LIVE_VIEWER_SYNC_API_PATH } from "@/constants/live/live";

const HEARTBEAT_INTERVAL_MS = 10_000;
// 하트비트 sync 엔드포인트 — 익명 식별 쿠키(pp_anon_viewer)를 서버가 발급·검증한다.
const SYNC_URL = LIVE_VIEWER_SYNC_API_PATH;
// pagehide 시 sendBeacon으로 leave를 보내는 동일 출처 엔드포인트.
const LEAVE_BEACON_URL = LIVE_VIEWER_LEAVE_API_PATH;

export function useLiveViewerPresence(broadcastId: string | null | undefined) {
  useEffect(() => {
    if (!broadcastId) return;

    const sendHeartbeat = () => {
      // 동일 출처 fetch라 쿠키가 자동 동봉된다(서버가 익명 식별 쿠키를 읽거나 첫 요청에 발급).
      void fetch(SYNC_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ broadcastId }),
      }).catch(() => {
        // 부수효과라 실패는 무시한다(다음 주기·복귀 하트비트가 보정).
      });
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // hard unload(탭 닫기·새로고침·외부 이동)에선 cleanup의 서버 액션이 중단될 수 있어,
    // pagehide에서 sendBeacon으로 즉시 leave를 보장한다(SPA 내부 이동은 cleanup이 처리).
    const handlePageHide = (event: PageTransitionEvent) => {
      // bfcache로 얼면(persisted) 곧 복원될 수 있어 leave하지 않는다(복원 시 하트비트 재개,
      // 끝내 안 돌아오면 cron sweep이 정리). 실제 unload에서만 즉시 leave를 보낸다.
      if (event.persisted) return;
      if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
      const payload = JSON.stringify({ broadcastId });
      navigator.sendBeacon(LEAVE_BEACON_URL, new Blob([payload], { type: "application/json" }));
    };
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      void leaveLiveViewerPresenceAction(broadcastId);
    };
  }, [broadcastId]);
}
