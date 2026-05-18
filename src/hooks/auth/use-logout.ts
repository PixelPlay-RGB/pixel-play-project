"use client";
// 로그아웃 요청과 인증 상태 정리를 관리하는 mutation 훅
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      router.refresh();
    },
    onError: (error) => {
      console.error("로그아웃 요청 실패", error);
    },
  });
}
