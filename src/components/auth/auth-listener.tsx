"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { APP_MESSAGE_CODE } from "@/constants/app-message";
import { toastAppError } from "@/utils/toast-message";

/**
 * 앱 루트에서 1회 마운트되어 Supabase Auth 상태를 Zustand store(AuthUser)에 동기화.
 * - onAuthStateChange 구독으로 INITIAL_SESSION / SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED 자동 반영
 * - 서버 검증 getUser() 실패 시 스테일 쿠키 정리
 *
 * DB 프로필(public.user)은 여기서 다루지 않음 → React Query의 useProfile 훅 사용.
 */
export default function AuthListener() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setIsCanChangePassword = useAuthStore((s) => s.setIsCanChangePassword);
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
    });

    // 서버에서 세션 실제 유효성 검증 (스테일 JWT 방어)
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        supabase.auth.signOut({ scope: "local" });
        setUser(null);
      } else {
        setUser(data.user ?? null);
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, queryClient]);

  useEffect(() => {
    const supabase = createClient();

    const getProviders = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user")
        .select("linked_providers")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        toastAppError(APP_MESSAGE_CODE.error.auth.oauthInfoLoadFailed);
        return;
      }

      if (!data) {
        // 프로필 미생성(complete-profile 진행 중) — 정상 케이스
        setIsCanChangePassword(false);
        return;
      }

      setIsCanChangePassword(data.linked_providers.includes("email"));
    };

    getProviders();
  }, [user, setIsCanChangePassword]);

  return null;
}
