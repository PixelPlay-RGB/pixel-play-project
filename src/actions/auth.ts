"use server";

import { createClient } from "@/lib/supabase/server";
import {
  completeOAuthProfileSchema,
  LoginFormValues,
  loginSchema,
  signUpBaseSchema,
} from "@/lib/zod/auth";
import { CompleteOAuthProfileInput, CompleteSignupInput } from "@/types/auth";
import { revalidatePath } from "next/cache";

export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: { displayName: string };
}

/**
 * 로그인 서버 액션
 */
export async function login(data: LoginFormValues): Promise<ActionResponse> {
  const supabase = await createClient();

  const validatedFields = loginSchema.safeParse(data);
  if (!validatedFields.success) {
    return {
      success: false,
      message: "아이디와 비밀번호를 확인해주세요!",
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    data: {
      displayName: user?.user_metadata.display_name,
    },
  };
}

/**
 * 1. OTP 메일 발송
 */
export async function sendOtpAction(email: string): Promise<ActionResponse> {
  const supabase = await createClient();

  // 기존에 로컬 세션 정리
  await supabase.auth.signOut({ scope: "local" });

  // 중복 이메일 체크 (supabase RPC 사용)
  const { data: exists, error: rpcError } = await supabase.rpc("check_email_exists", {
    target_email: email,
  });

  if (rpcError) {
    return { success: false, message: "이메일 확인 중 오류가 발생했습니다." };
  }
  if (exists) {
    return { success: false, message: "이미 가입된 이메일입니다." };
  }

  // OTP 발송
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

/**
 * 2. OTP 번호 검증
 */
export async function verifyOtpAction(email: string, token: string): Promise<ActionResponse> {
  const supabase = await createClient();

  // 해당 작업 성공시 임시 세션이 생성됨
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

/**
 * 3. 일반 회원가입 완료 (OTP 인증 후의 로직)
 */
export async function completeSignupAction(data: CompleteSignupInput): Promise<ActionResponse> {
  // 스키마 검증
  const parsed = signUpBaseSchema.omit({ email: true, passwordConfirm: true }).safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "입력값이 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const { password, displayName, name, birth, phone, gender } = parsed.data;

  // 현재 인증된 유저 가져오기 (OTP 인증 직후의 상태)
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    return { success: false, message: "인증 정보를 찾을 수 없습니다." };
  }

  // 비밀번호 및 기본 메타데이터 업데이트
  const { error: authError } = await supabase.auth.updateUser({
    password,
    data: {
      display_name: displayName,
      name,
    },
  });

  if (authError) {
    return { success: false, message: authError.message };
  }

  // public.user 테이블에 최종적인 데이터 upsert <- update + insert
  const { error: dbError } = await supabase.from("user").upsert(
    {
      oauth_id: user.id,
      email: user.email!,
      name: name,
      display_name: displayName,
      birth: birth,
      phone: phone,
      gender: gender,
    },
    { onConflict: "oauth_id" },
  );

  if (dbError) {
    return { success: false, message: dbError.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * 4. OAuth 유저 추가 정보 완료
 */
export async function completeOAuthProfileAction(
  data: CompleteOAuthProfileInput,
): Promise<ActionResponse> {
  const parsed = completeOAuthProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "입력값이 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const { displayName, birth, phone, gender } = parsed.data;

  // 현재 세션의 유저 정보 가져오기
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return {
      success: false,
      message: "인증 정보를 찾을 수 없습니다.",
    };
  }

  const { error: dbError } = await supabase.from("user").upsert({
    oauth_id: user.id,
    email: user.email!,
    name: user.user_metadata?.full_name ?? displayName,
    display_name: displayName,
    birth,
    phone,
    gender,
  });

  if (dbError) {
    return {
      success: false,
      message: dbError.message,
    };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
