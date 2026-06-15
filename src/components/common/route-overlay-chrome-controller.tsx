"use client";

// OBS 출력·채팅 팝아웃 전용 라우트에서는 앱 공통 크롬을 숨깁니다(투명 배경).
// 클립 에디터 팝업 라우트에서도 헤더·푸터를 숨기되 배경은 불투명하게 둡니다(별도 클래스).
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

const OVERLAY_ROUTE_PATTERN = /^\/live\/[^/]+\/(?:chat|alerts\/donation)(?:\/[^/]+)?$/;
// 클립 에디터(별도 창) — 헤더·푸터 없이 풀블리드로 채운다.
const CHROMELESS_ROUTE_PATTERN = /^\/clip\/editor(?:\/|$)/;

export default function RouteOverlayChromeController() {
  const pathname = usePathname();
  const isOverlayRoute = OVERLAY_ROUTE_PATTERN.test(pathname);
  const isChromelessRoute = CHROMELESS_ROUTE_PATTERN.test(pathname);

  useLayoutEffect(() => {
    document.body.classList.toggle("is-overlay-route", isOverlayRoute);
    document.body.classList.toggle("is-chromeless-route", isChromelessRoute);

    return () => {
      document.body.classList.remove("is-overlay-route");
      document.body.classList.remove("is-chromeless-route");
    };
  }, [isOverlayRoute, isChromelessRoute]);

  return null;
}
