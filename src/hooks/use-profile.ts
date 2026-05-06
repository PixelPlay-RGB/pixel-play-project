"use client";

import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/auth";
import { DBUser } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";

/**
 * 현재 로그인된 유저의 public.user 프로필을 조회.
 * - AuthUser(Zustand)가 준비되면 자동 실행
 * - 5분간 캐싱 → 여러 컴포넌트에서 호출해도 네트워크 1회
 * - 프로필 업데이트 후에는 `queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profile() })`로 갱신
 */
export function useUser() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  return useQuery<DBUser | null>({
    queryKey: QUERY_KEYS.auth.profile(user?.id),
    queryFn: async () => {
      const supabase = createClient();
      const authUser = user ?? (await supabase.auth.getUser()).data.user;

      if (!authUser) {
        return null;
      }

      if (!user) {
        setUser(authUser);
      }

      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("oauth_id", authUser.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: user ? 1000 * 60 * 5 : 0,
    refetchOnMount: "always",
  });
}
