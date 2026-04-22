"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { useEffect } from "react";

/**
 * 앱 루트에서 1회만 마운트되어 Supabase Auth 상태를 Zustand store에 동기화.
 * - 최초 진입 시 getUser()로 초기 유저 로드
 * - onAuthStateChange 구독하여 로그인/로그아웃/토큰 갱신 시 store 자동 반영
 */
export default function AuthListener() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    // 해당 useEffect는 해당 컴포넌트가 mounted 되는 시점에 한 번만 실행됨
    const supabase = createClient();

    // subscription 이벤트 등록으로 supabase.auth가 변경될 때마다 내부의 콜백 함수 실행
    // INITIAL_SESSION: 구독 즉시 현재 세션 전달 → loading 상태 해제
    // SIGNED_OUT: 세션 만료/삭제 시 자동 발화 → store null 처리
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 서버에서 실제 유효성 검증 (캐시된 JWT가 아닌 실제 auth.users 존재 여부 확인)
    // 삭제된 유저의 스테일 쿠키가 남아있을 경우 → 로컬 세션 정리 → SIGNED_OUT 발화
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
