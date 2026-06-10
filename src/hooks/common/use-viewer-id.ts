"use client";
// 서버에서 확인한 viewerId를 1차 기준으로 쓰고, 없으면 클라 Zustand 유저 id로 보조한다.
// SSR/하이드레이션 동안 Zustand는 항상 null이라 prop viewerId가 우선이어야 로그인 폴백 오노출을 막는다.

import { useAuthStore } from "@/stores/auth";

export function useViewerId(viewerId: string | null): string | undefined {
  const storeUserId = useAuthStore((state) => state.user?.id);

  return viewerId ?? storeUserId;
}
