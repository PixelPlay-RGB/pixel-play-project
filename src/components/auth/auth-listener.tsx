"use client";
// auth-listener 컴포넌트를 제공합니다.

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { isAuthSessionMissingError, isRecoverableAuthSessionError } from "@/utils/auth/auth-error";

/**
 * 앱 루트에서 1회 마운트되어 Supabase Auth 상태를 Zustand store(AuthUser)에 동기화.
 * - onAuthStateChange 구독으로 INITIAL_SESSION / SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED 자동 반영
 * - 서버 검증 getUser() 실패 시 스테일 쿠키 정리
 *
 * DB 프로필(public.user)은 여기서 다루지 않음 → React Query의 useProfile 훅 사용.
 */
export default function AuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
    });

    // 서버에서 세션 실제 유효성 검증 (스테일 JWT 방어)
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) {
        if (!isRecoverableAuthSessionError(error)) {
          console.error("인증 리스너의 인증 유저 조회 실패", error);
        }
        if (!isAuthSessionMissingError(error)) {
          await supabase.auth.signOut({ scope: "local" });
        }
        setUser(null);
      } else {
        setUser(data.user ?? null);
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, queryClient]);

  return null;
}
