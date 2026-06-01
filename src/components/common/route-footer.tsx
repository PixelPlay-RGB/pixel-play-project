"use client";
// 현재 route 기준으로 공용 Footer 노출 여부를 제어합니다.

import Footer from "@/components/common/footer";
import { usePathname } from "next/navigation";

export default function RouteFooter() {
  const pathname = usePathname();
  const isChatRoomRoute = pathname.startsWith("/chat/room");
  const isLiveListRoute = pathname === "/live";
  const isLiveOverlayRoute = /^\/live\/[^/]+\/(?:chat|alerts\/donation)(?:\/[^/]+)?\/?$/.test(
    pathname,
  );
  // 사이드바 대시보드(채널 관리·유저 설정)는 사이드바 하단 크레딧으로 대체합니다.
  const isSidebarDashboardRoute = pathname.startsWith("/channel") || pathname.startsWith("/user");

  if (isChatRoomRoute || isLiveListRoute || isLiveOverlayRoute || isSidebarDashboardRoute) {
    return null;
  }

  return <Footer />;
}
