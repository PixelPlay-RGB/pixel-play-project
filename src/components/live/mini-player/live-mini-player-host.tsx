"use client";
// 라이브 미니플레이어 호스트 — 루트 layout에 영속 마운트되어, 활성 시청 세션이 있고
// 시청 페이지 밖이면 미니플레이어를 띄웁니다. 시청자 presence(하트비트)를 페이지가 아닌
// 여기서 단독 호출해, 페이지↔미니 전환 시 훅이 언마운트되지 않아 leave/sync 경합과
// 시청자 수 깜빡임이 생기지 않는다(X·방송 종료로 세션이 끝날 때만 cleanup이 leave).

import { usePathname } from "next/navigation";

import { LiveMiniPlayer } from "@/components/live/mini-player/live-mini-player";
import { LIVE_OVERLAY_ROUTE_PATTERN, LIVE_WATCH_ROUTE_PATTERN } from "@/constants/live/live";
import { useLiveViewerPresence } from "@/hooks/live/use-live-viewer-presence";
import { useLiveWatchSessionStore } from "@/stores/live-watch-session";

export function LiveMiniPlayerHost() {
  const pathname = usePathname();
  const session = useLiveWatchSessionStore((state) => state.session);
  const endSession = useLiveWatchSessionStore((state) => state.endSession);
  // 사용자가 시청 페이지에서 명시적으로 켠 PIP — 켜져 있으면 시청 페이지에서도 미니를 띄운다.
  const isPip = useLiveWatchSessionStore((state) => state.isPip);

  useLiveViewerPresence(session?.broadcastId);

  // 표시 여부는 순수 파생 — 시청 페이지(어느 크리에이터든 — LiveView가 세션을 인수/종료하므로,
  // 시청 간 전환 로딩 중 직전 방송 미니가 잠깐 떠 HLS가 이중 기동하는 것 방지)와
  // 별도 창 라우트(OBS 출력·팝아웃)에선 아무것도 안 띄운다.
  // 단, 시청 페이지여도 사용자가 PIP를 켰으면(isPip) 미니로 띄운다 — 인라인 비디오는 안내로
  // 교체돼 있어(LivePipPlaceholder) 이중 기동이 아니다(한쪽만 <video>를 가진다).
  if (
    !session ||
    // 인증 플로우(로그인·회원가입·프로필 완성)에선 미니플레이어를 숨긴다 — 집중 화면이라 PIP가 부적절.
    pathname.startsWith("/auth/") ||
    (LIVE_WATCH_ROUTE_PATTERN.test(pathname) && !isPip) ||
    LIVE_OVERLAY_ROUTE_PATTERN.test(pathname)
  ) {
    return null;
  }

  // broadcastId로 key를 묶어 세션 교체(다른 라이브) 시 시청자 수 등 내부 상태를 초기화한다.
  return <LiveMiniPlayer key={session.broadcastId} session={session} onClose={endSession} />;
}
