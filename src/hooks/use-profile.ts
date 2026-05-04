"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { DBUser } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";

/**
 * 현재 로그인된 유저의 public.user 프로필을 조회.
 * - AuthUser(Zustand)가 준비되면 자동 실행
 * - 5분간 캐싱 → 여러 컴포넌트에서 호출해도 네트워크 1회
 */
export function useUser() {
  const user = useAuthStore((s) => s.user);

  return useQuery<DBUser | null>({
    queryKey: QUERY_KEYS.auth.profile(user?.id),
    queryFn: async () => {
      if (!user) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("oauth_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
