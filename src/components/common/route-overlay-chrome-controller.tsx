"use client";

// OBS 출력 전용 라우트에서는 앱 공통 헤더를 숨깁니다.
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const OVERLAY_ROUTE_PATTERN = /^\/live\/[^/]+\/(?:chat|alerts\/donation)(?:\/[^/]+)?$/;

export default function RouteOverlayChromeController() {
  const pathname = usePathname();
  const isOverlayRoute = OVERLAY_ROUTE_PATTERN.test(pathname);

  useEffect(() => {
    document.body.classList.toggle("is-overlay-route", isOverlayRoute);

    return () => {
      document.body.classList.remove("is-overlay-route");
    };
  }, [isOverlayRoute]);

  return null;
}
