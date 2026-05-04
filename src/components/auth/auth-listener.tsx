"use client";

import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/auth";
import { useEffect } from "react";

/**
 * 앱 루트에서 1회 마운트되어 Supabase Auth 상태를 Zustand store(AuthUser)에 동기화.
 * - onAuthStateChange 구독으로 INITIAL_SESSION / SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED 자동 반영
 * - 서버 검증 getUser() 실패 시 스테일 쿠키 정리
 *
 * DB 프로필(public.user)은 여기서 다루지 않음 → React Query의 useProfile 훅 사용.
 */
export default function AuthListener() {
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    const supabase = createClient();

    // 👉 여기에 'const {' 가 빠져 있었습니다.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 서버에서 세션 실제 유효성 검증 (스테일 JWT 방어)
    supabase.auth.getUser().then(({ error }) => {
      if (error) {
        supabase.auth.signOut({ scope: "local" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  return null;
}
