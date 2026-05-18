"use server";
// 현재 비밀번호 확인과 비밀번호 변경 Server Action을 관리합니다.
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { FORM_MESSAGE } from "@/constants/form-message";
import type { ActionResponse } from "@/actions/auth/shared";
import { createClient } from "@/lib/supabase/server";
import { changePasswordActionSchema } from "@/lib/zod/auth";
import type { FieldActionResult } from "@/types/action";
import { isAuthSessionMissingError } from "@/utils/auth-error";
import { revalidatePath } from "next/cache";

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

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResponse> {
  const parsed = changePasswordActionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.invalidInput };
  }

  const supabase = await createClient();
  const { currentPassword, newPassword } = parsed.data;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("비밀번호 변경 중 인증 유저 조회 실패", userError);
  }

  if (!user?.email) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoLoadFailed };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    console.error("비밀번호 변경 중 현재 비밀번호 재검증 실패", verifyError);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.passwordChangeFailed };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("비밀번호 변경 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.passwordChangeFailed };
  }

  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    console.error("비밀번호 변경 후 로그아웃 실패", signOutError);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.passwordChangedLogoutFailed };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
