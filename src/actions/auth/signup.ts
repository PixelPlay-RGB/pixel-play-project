"use server";
// 이메일 OTP 회원가입 Server Action을 관리합니다.
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { FORM_MESSAGE } from "@/constants/common/form-message";
import { checkEmailExists, checkNicknameExists } from "@/actions/auth/shared";
import type { ActionResponse } from "@/types/common/action";
import { createClient } from "@/lib/supabase/server";
import { signUpBaseSchema } from "@/lib/zod/auth";
import type { FieldActionResult } from "@/types/common/action";
import type { CompleteSignupInput } from "@/types/auth/auth";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { revalidatePath } from "next/cache";

export async function sendOtpAction(email: string): Promise<FieldActionResult> {
  const supabase = await createClient();

  // 기존에 로컬 세션 정리
  await supabase.auth.signOut({ scope: "local" });

  const emailCheck = await checkEmailExists(email);

  if (!emailCheck.success) {
    return { success: false, fieldMessage: FORM_MESSAGE.auth.emailCheckFailed };
  }

  if (emailCheck.exists) {
    return { success: false, fieldMessage: FORM_MESSAGE.auth.emailAlreadyExists };
  }

  // OTP 발송
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    console.error("OTP 이메일 발송 실패", error);
    return { success: false, fieldMessage: FORM_MESSAGE.auth.emailCheckFailed };
  }

  return { success: true };
}

export async function verifyOtpAction(email: string, token: string): Promise<FieldActionResult> {
  const supabase = await createClient();

  // 해당 작업 성공시 임시 세션이 생성됨
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    console.error("OTP 검증 실패", error);
    return { success: false, fieldMessage: FORM_MESSAGE.auth.otpInvalid };
  }

  return { success: true };
}

export async function checkNicknameAction(nickname: string): Promise<ActionResponse> {
  const nicknameCheck = await checkNicknameExists(nickname);

  if (!nicknameCheck.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.nicknameCheckFailed };
  }

  if (nicknameCheck.exists) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.nicknameAlreadyUsed };
  }

  return { success: true };
}

export async function completeSignupAction(data: CompleteSignupInput): Promise<ActionResponse> {
  // 스키마 검증
  const parsed = signUpBaseSchema.omit({ email: true, passwordConfirm: true }).safeParse(data);
  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.invalidInput };
  }

  const supabase = await createClient();
  const { password, nickname, name, birth, phone, gender } = parsed.data;

  // 현재 인증된 유저 가져오기 (OTP 인증 직후의 상태)
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    if (getUserError && !isAuthSessionMissingError(getUserError)) {
      console.error("회원가입 완료 중 인증 유저 조회 실패", getUserError);
    }
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  // 비밀번호 및 기본 메타데이터 업데이트
  const { error: authError } = await supabase.auth.updateUser({
    password,
    data: {
      display_name: nickname,
      name,
    },
  });

  if (authError) {
    console.error("회원가입 완료 중 인증 정보 업데이트 실패", authError);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoLoadFailed };
  }

  const nicknameCheck = await checkNicknameExists(nickname);
  if (!nicknameCheck.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.nicknameCheckFailed };
  }

  if (nicknameCheck.exists) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.nicknameAlreadyUsed };
  }

  // public.user 테이블에 최종적인 데이터 upsert <- update + insert
  const { error: dbError } = await supabase.from("user").upsert(
    {
      id: user.id,
      email: user.email!,
      name: name,
      nickname,
      birth: birth,
      phone: phone,
      gender: gender,
      photo_url: null,
      linked_providers: ["email"],
    },
    { onConflict: "id" },
  );

  if (dbError) {
    console.error("회원가입 완료 중 사용자 프로필 저장 실패", dbError);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.signupFailed };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
