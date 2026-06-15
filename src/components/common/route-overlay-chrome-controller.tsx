"use client";

// OBS 출력·채팅 팝아웃 전용 라우트에서는 앱 공통 크롬을 숨깁니다(투명 배경).
// (클립 에디터 풀블리드는 globals.css의 body:has(.clip-editor-root)로 SSR 시점에 처리한다.)
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

const OVERLAY_ROUTE_PATTERN = /^\/live\/[^/]+\/(?:chat|alerts\/donation)(?:\/[^/]+)?$/;

export default function RouteOverlayChromeController() {
  const pathname = usePathname();
  const isOverlayRoute = OVERLAY_ROUTE_PATTERN.test(pathname);

  useLayoutEffect(() => {
    document.body.classList.toggle("is-overlay-route", isOverlayRoute);

    return () => {
      document.body.classList.remove("is-overlay-route");
    };
  }, [isOverlayRoute]);

  return null;
}
