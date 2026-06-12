"use client";
// 현재 route 기준으로 공용 Footer 노출 여부를 제어합니다.

import Footer from "@/components/common/footer";
import { usePathname } from "next/navigation";

export default function RouteFooter() {
  const pathname = usePathname();
  // 인덱스(홈) = 라이브 목록 — 뷰포트 풀스크린 레이아웃이므로 푸터 불필요
  const isLiveListRoute = pathname === "/";
  // /live/[creatorId] 및 하위 라우트 — 뷰포트 풀스크린 레이아웃이므로 푸터 불필요
  const isLiveWatchRoute = /^\/live\/(?!search(?:\/|$))[^/]+/.test(pathname);
  const isLiveOverlayRoute = /^\/live\/[^/]+\/(?:chat|alerts\/donation)(?:\/[^/]+)?\/?$/.test(
    pathname,
  );
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
