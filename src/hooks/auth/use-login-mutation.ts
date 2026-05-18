"use client";
// 로그인 Server Action과 OAuth 로그인 요청의 클라이언트 후처리를 관리하는 훅
import { login } from "@/actions/auth/login";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { LOGIN_PARAM } from "@/constants/auth";
import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import type { LoginFormValues, OAuthProvider } from "@/types/auth";
import { isAuthSessionMissingError } from "@/utils/auth-error";
import { toastAppError } from "@/utils/toast-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useLoginMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const result = await login(data);

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.auth.invalidCredentials);
        return result;
      }

      const supabase = createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        if (authError && !isAuthSessionMissingError(authError)) {
          console.error("로그인 후 인증 유저 조회 실패", authError);
        }
        toastAppError(APP_MESSAGE_CODE.error.auth.authInfoLoadFailed);
        return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoLoadFailed };
      }

      setUser(authUser);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profile(authUser.id) });

      router.replace(`/${LOGIN_PARAM}`);

      return result;
    },
    onError: (error) => {
      console.error("로그인 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.auth.invalidCredentials);
    },
  });
}

export function useOAuthLoginMutation() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (provider: OAuthProvider) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error(`${provider} 로그인 실패`, error.message);
        toastAppError(APP_MESSAGE_CODE.error.oauth.linkFailed);
        return { success: false, code: APP_MESSAGE_CODE.error.oauth.linkFailed };
      }

      return { success: true };
    },
    onError: (error) => {
      console.error("OAuth 로그인 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.oauth.linkFailed);
    },
  });
}
