"use client";
// 라이브 목록("/")으로 라우트가 바뀌어 돌아올 때 시청자 수 등 라이브 데이터를 갱신합니다.
// App Router가 뒤로가기 시 "/" 페이지를 캐시에서 복원해 LiveList가 재마운트되지 않으면
// refetchOnMount가 동작하지 않을 수 있어, 경로 전환을 감지해 목록·사이드바 쿼리를 무효화합니다.

import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { QUERY_KEYS } from "@/constants/common/query-keys";

export default function LiveDataRouteRefresher() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = pathname;

    // 최초 마운트(previousPath null)는 초기 fetch가 정상 동작하므로 제외하고,
    // 다른 경로에서 "/"로 복귀한 순간에만 갱신합니다.
    if (previousPath !== null && previousPath !== pathname && pathname === "/") {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.live.listAll() });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.live.sidebarAll() });
    }
  }, [pathname, queryClient]);

  return null;
}
