"use server";

import { createClient } from "@/lib/supabase/server";
import {
  completeOAuthProfileSchema,
  LoginFormValues,
  loginSchema,
  signUpBaseSchema,
} from "@/lib/zod/auth";

import {
  CompleteOAuthProfileInput,
  CompleteSignupInput,
  LoginProvider,
  OAuthProvider,
} from "@/types/auth";
import { revalidatePath } from "next/cache";
import { success } from "zod";

export interface ActionResponse {
  success: boolean;
  message?: string;
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

  const { error } = await supabase.auth.signInWithPassword({
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
 * 닉네임 중복 확인
 */
export async function checkNicknameAction(nickname: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const { data: exists, error } = await supabase.rpc("check_nickname_exists", {
    target_nickname: nickname,
  });

  if (error) {
    return { success: false, message: "닉네임 확인 중 오류가 발생했습니다." };
  }

  if (exists) {
    return { success: false, message: "이미 사용 중인 닉네임입니다." };
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
  const { password, nickname, name, birth, phone, gender } = parsed.data;

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
      display_name: nickname,
      name,
    },
  });

  if (authError) {
    return { success: false, message: authError.message };
  }

  // 닉네임 중복 체크
  const { data: nicknameExists } = await supabase.rpc("check_nickname_exists", {
    target_nickname: nickname,
  });
  if (nicknameExists) {
    return { success: false, message: "이미 사용 중인 닉네임입니다." };
  }

  // public.user 테이블에 최종적인 데이터 upsert <- update + insert
  const { error: dbError } = await supabase.from("user").upsert(
    {
      oauth_id: user.id,
      email: user.email!,
      name: name,
      nickname,
      birth: birth,
      phone: phone,
      gender: gender,
      photo_url: null,
      linked_providers: ["email"],
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
 * 현재 비밀번호 검증
 */
export async function verifyCurrentPasswordAction(
  currentPassword: string,
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, message: "인증 정보를 불러올 수 없습니다." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (error) {
    return { success: false, message: "현재 비밀번호가 올바르지 않습니다." };
  }

  return { success: true };
}

/**
 * 비밀번호 변경
 */
export async function changePasswordAction(newPassword: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { success: false, message: error.message };
  }

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
  const { name, nickname, birth, phone, gender } = parsed.data;

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

  // auth.users.user_metadata에도 display_name 반영 (어드민 대시보드 + 세션 일관성)
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      name,
    },
  });

  if (authError) {
    return { success: false, message: authError.message };
  }

  // 닉네임 중복 체크
  const { data: nicknameExists } = await supabase.rpc("check_nickname_exists", {
    target_nickname: nickname,
  });
  if (nicknameExists) {
    return { success: false, message: "이미 사용 중인 닉네임입니다." };
  }

  const VALID_PROVIDERS: LoginProvider[] = ["google", "github"];
  const linkedProviders = ((user.app_metadata?.providers ?? []) as string[]).filter(
    (p): p is LoginProvider => VALID_PROVIDERS.includes(p as LoginProvider),
  );

  const { error: dbError } = await supabase.from("user").upsert(
    {
      oauth_id: user.id,
      email: user.email!,
      name,
      nickname,
      birth,
      phone,
      gender,
      photo_url: (user.user_metadata?.avatar_url as string) ?? null,
      ...(linkedProviders.length > 0 ? { linked_providers: linkedProviders } : {}),
    },
    { onConflict: "oauth_id" },
  );

  if (dbError) {
    return {
      success: false,
      message: dbError.message,
    };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * 5. OAuth 유저 연동 해제
 */
export async function unLinkOAuthAction(provider: OAuthProvider): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "유저 인증 정보가 없습니다.",
    };
  }

  const identity = user.identities?.find((id) => id.provider === provider);

  if (!identity) {
    return {
      success: false,
      message: "연동된 계정을 찾을 수 없습니다.",
    };
  }

  const { error: unLinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unLinkError) {
    return {
      success: false,
      message: "계정 연동 해제에 실패했습니다.",
    };
  }

  const { data: dbUser, error: dbUserError } = await supabase
    .from("user")
    .select("linked_providers")
    .eq("oauth_id", user.id)
    .single();

  if (!dbUser || dbUserError) {
    return {
      success: false,
      message: "프로필 정보와 일치하는 유저가 없습니다.",
    };
  }

  const currentProviders = dbUser.linked_providers || [];
  const updatedProviders = currentProviders.filter((p: string) => p !== provider);

  const { error: updateError } = await supabase
    .from("user")
    .update({ linked_providers: updatedProviders })
    .eq("oauth_id", user.id);

  if (updateError) {
    return {
      success: false,
      message: "데이터베이스 업데이트에 실패했습니다.",
    };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * 프로필 업데이트
 */
export async function updateProfileAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();

  // Form 데이터에서 값 추출
  const nickname = formData.get("nickname") as string;
  const file = formData.get("file") as File | null;
  let photoUrl = formData.get("photoUrl") as string | null;
  const shouldDeleteImage = formData.get("shouldDeleteImage") === "true";

  // 유저 세션 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return {
      success: false,
      message: "유저 인증 정보가 없습니다.",
    };
  }

  // 이미지 처리
  if (file) {
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      return {
        success: false,
        message: "이미지 저장에 실패했습니다.",
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profiles").getPublicUrl(filePath);
    photoUrl = `${publicUrl}?t=${Date.now()}`;
  } else if (shouldDeleteImage) {
    // Storage에 파일이 있는 경우 삭제 로직
    const { data: files } = await supabase.storage.from("profiles").list(`avatars/${user.id}`);
    if (files && files.length > 0) {
      const filesToDelete = files.map((f) => `avatars/${user.id}/${f.name}`);
      await supabase.storage.from("profiles").remove(filesToDelete);
    }

    photoUrl = null;
  }

  // Auth & DB에 데이터 업데이트
  // displayName은 회원가입할때도 굳이 안 건들였음
  await supabase.auth.updateUser({
    data: { avatar_url: photoUrl },
  });

  const { error: updateError } = await supabase
    .from("user")
    .update({
      nickname,
      photo_url: photoUrl,
    })
    .eq("oauth_id", user.id);

  if (updateError) {
    return {
      success: false,
      message: updateError.message || "유저 업데이트에 실패했습니다.",
    };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
  };
}
