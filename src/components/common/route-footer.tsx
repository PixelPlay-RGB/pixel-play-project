"use client";
// 현재 route 기준으로 공용 Footer 노출 여부를 제어합니다.

import Footer from "@/components/common/footer";
import { usePathname } from "next/navigation";

import { LIVE_OVERLAY_ROUTE_PATTERN, LIVE_WATCH_ROUTE_PATTERN } from "@/constants/live/live";

export default function RouteFooter() {
  const pathname = usePathname();
  // 인덱스(홈) = 라이브 목록 — 뷰포트 풀스크린 레이아웃이므로 푸터 불필요
  const isLiveListRoute = pathname === "/";
  // /live/[creatorId](시청)와 그 하위 별도 창 라우트(팝아웃·OBS 출력) — 둘 다 풀스크린/투명
  // 레이아웃이므로 푸터 불필요. 실제 존재하는 /live 하위 라우트는 두 공유 패턴이 전부 커버한다.
  const isLiveWatchRoute = LIVE_WATCH_ROUTE_PATTERN.test(pathname);
  const isLiveOverlayRoute = LIVE_OVERLAY_ROUTE_PATTERN.test(pathname);
  // 사이드바 대시보드(채널 관리·유저 설정)는 사이드바 하단 크레딧으로 대체합니다.
  const isSidebarDashboardRoute = pathname.startsWith("/channel") || pathname.startsWith("/user");
  // 클립 디테일(쇼츠) — 뷰포트 풀스크린 레이아웃이므로 푸터 불필요
  const isClipDetailRoute = pathname.startsWith("/clip/");

  if (
    isLiveListRoute ||
    isLiveWatchRoute ||
    isLiveOverlayRoute ||
    isSidebarDashboardRoute ||
    isClipDetailRoute
  ) {
    return null;
  }

  return <Footer />;
}
