"use client";
// 현재 route 기준으로 공용 Footer 노출 여부를 제어합니다.

import Footer from "@/components/common/footer";
import { usePathname } from "next/navigation";

export default function RouteFooter() {
  const pathname = usePathname();
  const isChatRoomRoute = pathname.startsWith("/chat/room");
  // /live/[creatorId] 및 하위 라우트 — 뷰포트 풀스크린 레이아웃이므로 푸터 불필요
  const isLiveWatchRoute = /^\/live\/(?!search(?:\/|$))[^/]+/.test(pathname);

  if (isChatRoomRoute || isLiveWatchRoute) {
    return null;
  }

  return <Footer />;
}
