"use server";

import { createClient } from "@/lib/supabase/server";
import { signUpBaseSchema } from "@/lib/zod/auth";
import { CompleteSignupInput } from "@/types/auth";

export async function sendOtpAction(email: string) {
  const supabase = await createClient();

  const { data: exists, error: rpcError } = await supabase.rpc("check_email_exists", {
    target_email: email,
  });
  if (rpcError) return { success: false, message: "이메일 확인 중 오류가 발생했습니다." };
  if (exists) return { success: false, message: "이미 가입된 이메일입니다." };

  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function verifyOtpAction(email: string, token: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function completeSignupAction(data: CompleteSignupInput) {
  const parsed = signUpBaseSchema.omit({ email: true, passwordConfirm: true }).safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "입력값이 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: {
      name: parsed.data.name,
      birth: parsed.data.birth,
      phone: parsed.data.phone,
      gender: parsed.data.gender,
    },
  });

  if (error) return { success: false, message: error.message };
  return { success: true };
}
