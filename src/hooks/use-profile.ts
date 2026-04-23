"use client";

import { PROFILE_QUERY_KEY } from "@/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/auth";
import { DBUser } from "@/types/user";
import { useQuery } from "@tanstack/react-query";

/**
 * 현재 로그인된 유저의 public.user 프로필을 조회.
 * - AuthUser(Zustand)가 준비되면 자동 실행
 * - 5분간 캐싱 → 여러 컴포넌트에서 호출해도 네트워크 1회
 * - 프로필 업데이트 후에는 `queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })`로 갱신
 */
export function useUser() {
  const user = useUserStore((s) => s.user);

  return useQuery<DBUser | null>({
    queryKey: [...PROFILE_QUERY_KEY, user?.id],
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
