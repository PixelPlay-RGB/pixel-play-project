"use client";
// 회원가입 Server Action 호출과 후속 클라이언트 처리를 관리하는 mutation 훅
import {
  checkNicknameAction,
  completeSignupAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/actions/auth/signup";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { WELCOME_PARAM } from "@/constants/auth";
import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import type { CompleteSignupInput } from "@/types/auth";
import { isAuthSessionMissingError } from "@/utils/auth-error";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: (email: string) => sendOtpAction(email),
    onSuccess: (result) => {
      if (result.success) {
        toastAppSuccess(APP_MESSAGE_CODE.success.auth.emailOtpSent);
      }
    },
    onError: (error) => {
      console.error("OTP 발송 요청 실패", error);
    },
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: ({ email, token }: { email: string; token: string }) =>
      verifyOtpAction(email, token),
    onSuccess: (result) => {
      if (result.success) {
        toastAppSuccess(APP_MESSAGE_CODE.success.auth.emailVerified);
      }
    },
    onError: (error) => {
      console.error("OTP 검증 요청 실패", error);
    },
  });
}

export function useCheckNicknameMutation() {
  return useMutation({
    mutationFn: (nickname: string) => checkNicknameAction(nickname),
    onError: (error) => {
      console.error("닉네임 중복 확인 요청 실패", error);
    },
  });
}

export function useCompleteSignupMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: CompleteSignupInput) => {
      const result = await completeSignupAction(data);

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.auth.signupFailed);
        return result;
      }

      const supabase = createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        if (authError && !isAuthSessionMissingError(authError)) {
          console.error("회원가입 후 인증 유저 조회 실패", authError);
        }
        toastAppError(APP_MESSAGE_CODE.error.auth.authInfoLoadFailed);
        setUser(null);
        return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoLoadFailed };
      }

      setUser(authUser);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profile(authUser.id) });

      router.push(`/${WELCOME_PARAM}`);
      router.refresh();

      return result;
    },
    onError: (error) => {
      console.error("회원가입 완료 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.auth.signupFailed);
    },
  });
}
