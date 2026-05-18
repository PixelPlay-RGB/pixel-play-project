"use client";
// OAuth 추가 프로필 완성 Server Action의 클라이언트 후처리를 관리하는 훅
import { completeOAuthProfileAction } from "@/actions/auth/oauth";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { WELCOME_PARAM } from "@/constants/auth";
import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import type { CompleteOAuthProfileValues } from "@/lib/zod/auth";
import { isAuthSessionMissingError } from "@/utils/auth-error";
import { toastAppError } from "@/utils/toast-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useCompleteProfileMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: CompleteOAuthProfileValues) => {
      const result = await completeOAuthProfileAction(data);

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.auth.profileCreateFailed);
        return result;
      }

      const supabase = createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        if (authError && !isAuthSessionMissingError(authError)) {
          console.error("프로필 완성 후 인증 유저 조회 실패", authError);
        }
        toastAppError(APP_MESSAGE_CODE.error.auth.sessionNotFound);
        return { success: false, code: APP_MESSAGE_CODE.error.auth.sessionNotFound };
      }

      setUser(authUser);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profile(authUser.id) });

      router.push(`/${WELCOME_PARAM}`);
      router.refresh();

      return result;
    },
    onError: (error) => {
      console.error("프로필 완성 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.auth.profileCreateFailed);
    },
  });
}
