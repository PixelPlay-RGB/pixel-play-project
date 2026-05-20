"use server";
// 이메일과 비밀번호 로그인 Server Action을 관리합니다.
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginFormValues } from "@/lib/zod/auth";
import type { ActionResponse } from "@/types/common/action";

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
