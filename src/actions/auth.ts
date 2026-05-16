"use server";

import { createClient } from "@/lib/supabase/server";
import {
  completeOAuthProfileSchema,
  LoginFormValues,
  loginSchema,
  signUpBaseSchema,
} from "@/lib/zod/auth";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { FORM_MESSAGE } from "@/constants/form-message";
import type { AppActionResult, FieldActionResult } from "@/types/action";
import { isAuthSessionMissingError } from "@/utils/auth-error";

import {
  CompleteOAuthProfileInput,
  CompleteSignupInput,
  LoginProvider,
  OAuthProvider,
} from "@/types/auth";
import { revalidatePath } from "next/cache";

export interface ActionResponse extends AppActionResult {
  photoUrl?: string | null;
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
      code: APP_MESSAGE_CODE.error.auth.invalidCredentials,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error("로그인 인증 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.invalidCredentials,
    };
  }

  return {
    success: true,
  };
}

/**
 * 1. OTP 메일 발송
 */
export async function sendOtpAction(email: string): Promise<FieldActionResult> {
  const supabase = await createClient();

  // 기존에 로컬 세션 정리
  await supabase.auth.signOut({ scope: "local" });

  // 중복 이메일 체크 (supabase RPC 사용)
  const { data: exists, error: rpcError } = await supabase.rpc("check_email_exists", {
    target_email: email,
  });

  if (rpcError) {
    console.error("이메일 중복 확인 실패", rpcError);
    return { success: false, fieldMessage: FORM_MESSAGE.auth.emailCheckFailed };
  }
  if (exists) {
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

/**
 * 2. OTP 번호 검증
 */
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

/**
 * 닉네임 중복 확인
 */
export async function checkNicknameAction(nickname: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const { data: exists, error } = await supabase.rpc("check_nickname_exists", {
    target_nickname: nickname,
  });

  if (error) {
    console.error("닉네임 중복 확인 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.nicknameCheckFailed };
  }

  if (exists) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.nicknameAlreadyUsed };
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

  // 닉네임 중복 체크
  const { data: nicknameExists } = await supabase.rpc("check_nickname_exists", {
    target_nickname: nickname,
  });
  if (nicknameExists) {
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

/**
 * 현재 비밀번호 검증
 */
export async function verifyCurrentPasswordAction(
  currentPassword: string,
): Promise<FieldActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("현재 비밀번호 검증 중 인증 유저 조회 실패", userError);
  }

  if (!user?.email) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoLoadFailed };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (error) {
    console.error("현재 비밀번호 검증 실패", error);
    return { success: false, fieldMessage: FORM_MESSAGE.auth.currentPasswordInvalid };
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
    console.error("비밀번호 변경 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.passwordChangeFailed };
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
    return { success: false, code: APP_MESSAGE_CODE.error.auth.invalidInput };
  }

  const supabase = await createClient();
  const { name, nickname, birth, phone, gender } = parsed.data;

  // 현재 세션의 유저 정보 가져오기
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("OAuth 프로필 완성 중 인증 유저 조회 실패", userError);
    }
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
    };
  }

  // auth.users.user_metadata에도 display_name 반영 (어드민 대시보드 + 세션 일관성)
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      name,
    },
  });

  if (authError) {
    console.error("OAuth 프로필 완성 중 인증 정보 업데이트 실패", authError);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoLoadFailed };
  }

  // 닉네임 중복 체크
  const { data: nicknameExists } = await supabase.rpc("check_nickname_exists", {
    target_nickname: nickname,
  });
  if (nicknameExists) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.nicknameAlreadyUsed };
  }

  const VALID_PROVIDERS: LoginProvider[] = ["google", "github"];
  const linkedProviders = ((user.app_metadata?.providers ?? []) as string[]).filter(
    (p): p is LoginProvider => VALID_PROVIDERS.includes(p as LoginProvider),
  );

  const { error: dbError } = await supabase.from("user").upsert(
    {
      id: user.id,
      email: user.email!,
      name,
      nickname,
      birth,
      phone,
      gender,
      photo_url: (user.user_metadata?.avatar_url as string) ?? null,
      ...(linkedProviders.length > 0 ? { linked_providers: linkedProviders } : {}),
    },
    { onConflict: "id" },
  );

  if (dbError) {
    console.error("OAuth 프로필 완성 중 사용자 프로필 저장 실패", dbError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.profileCreateFailed,
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
    if (authError && !isAuthSessionMissingError(authError)) {
      console.error("OAuth 연동 해제 중 인증 유저 조회 실패", authError);
    }
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.profile.authMissing,
    };
  }

  const identity = user.identities?.find((id) => id.provider === provider);

  if (!identity) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.oauth.identityNotFound,
    };
  }

  const { error: unLinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unLinkError) {
    console.error("OAuth 연동 해제 실패", unLinkError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.oauth.unlinkFailed,
    };
  }

  const { data: dbUser, error: dbUserError } = await supabase
    .from("user")
    .select("linked_providers")
    .eq("id", user.id)
    .single();

  if (!dbUser || dbUserError) {
    if (dbUserError) console.error("OAuth 연동 해제 중 사용자 프로필 조회 실패", dbUserError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.oauth.userProfileNotFound,
    };
  }

  const currentProviders = dbUser.linked_providers || [];
  const updatedProviders = currentProviders.filter((p: string) => p !== provider);

  const { error: updateError } = await supabase
    .from("user")
    .update({ linked_providers: updatedProviders })
    .eq("id", user.id);

  if (updateError) {
    console.error("OAuth 연동 해제 중 사용자 프로필 업데이트 실패", updateError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.oauth.dbUpdateFailed,
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
  let photoUrl = (formData.get("photoUrl") as string | null) || null;
  const shouldDeleteImage = formData.get("shouldDeleteImage") === "true";

  // 🚨 [추가된 로직] 파일 크기 검증 (5MB 제한)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file && file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.profile.imageTooLarge,
    };
  }

  // 유저 세션 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("프로필 수정 중 인증 유저 조회 실패", userError);
    }
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.profile.authMissing,
    };
  }

  // 이미지 처리
  if (file || shouldDeleteImage) {
    const { data: existingFiles } = await supabase.storage
      .from("profiles")
      .list(`avatars/${user.id}`);
    const existingPaths = (existingFiles ?? []).map((f) => `avatars/${user.id}/${f.name}`);

    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error("프로필 이미지 업로드 실패", uploadError);
        return {
          success: false,
          code: APP_MESSAGE_CODE.error.profile.imageUploadFailed,
        };
      }

      // 업로드 성공 후 다른 확장자의 잔재 파일 정리
      const orphans = existingPaths.filter((p) => p !== filePath);
      if (orphans.length > 0) {
        await supabase.storage.from("profiles").remove(orphans);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profiles").getPublicUrl(filePath);
      photoUrl = `${publicUrl}?t=${Date.now()}`;
    } else {
      if (existingPaths.length > 0) {
        await supabase.storage.from("profiles").remove(existingPaths);
      }
      photoUrl = null;
    }
  }

  // Auth & DB에 데이터 업데이트
  // displayName은 회원가입할때도 굳이 안 건들였음
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { avatar_url: photoUrl },
  });

  if (authUpdateError) {
    console.error("프로필 수정 중 인증 정보 업데이트 실패", authUpdateError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.profile.userUpdateFailed,
    };
  }

  const { error: updateError } = await supabase
    .from("user")
    .update({
      nickname,
      photo_url: photoUrl,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("프로필 수정 중 사용자 프로필 업데이트 실패", updateError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.profile.userUpdateFailed,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    photoUrl,
  };
}
