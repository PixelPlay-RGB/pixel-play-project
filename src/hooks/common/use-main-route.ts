"use client";
// 현재 경로와 최근 주요 라우터를 기준으로 앱 섹션을 반환합니다.

import {
  DEFAULT_MAIN_ROUTE,
  isMainRoute,
  MAIN_ROUTE_STORAGE_KEY,
  resolveMainRoute,
} from "@/utils/common/main-route";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function useMainRoute() {
  const pathname = usePathname();
  const mainRoute = resolveMainRoute(pathname);
  const [storedMainRoute, setStoredMainRoute] = useState(DEFAULT_MAIN_ROUTE);

  useEffect(() => {
    const savedMainRoute = window.localStorage.getItem(MAIN_ROUTE_STORAGE_KEY);

    if (isMainRoute(savedMainRoute)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStoredMainRoute(savedMainRoute);
    }
  }, []);

  useEffect(() => {
    if (!mainRoute) return;

    window.localStorage.setItem(MAIN_ROUTE_STORAGE_KEY, mainRoute);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStoredMainRoute(mainRoute);
  }, [mainRoute]);

  return mainRoute ?? storedMainRoute;
}
