"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@/lib/supabase/server";
import { completeOAuthProfileSchema, signUpBaseSchema } from "@/lib/zod/auth";
import { CompleteOAuthProfileInput, CompleteSignupInput } from "@/types/auth";
import { getServerSession } from "next-auth";

export async function sendOtpAction(email: string) {
  const supabase = await createClient();

  await supabase.auth.signOut({ scope: "local" });

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

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();
  if (getUserError || !user) return { success: false, message: "인증 정보를 찾을 수 없습니다." };

  const { error: authError } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: {
      display_name: parsed.data.displayName,
      name: parsed.data.name,
    },
  });
  if (authError) return { success: false, message: authError.message };

  const { error: dbError } = await supabase.from("user").upsert(
    {
      oauth_id: user.id,
      email: user.email!,
      name: parsed.data.name,
      display_name: parsed.data.displayName,
      birth: parsed.data.birth,
      phone: parsed.data.phone,
      gender: parsed.data.gender,
    },
    { onConflict: "oauth_id" },
  );

  if (dbError) return { success: false, message: dbError.message };
  return { success: true };
}

export async function completeOAuthProfileAction(data: CompleteOAuthProfileInput) {
  const parsed = completeOAuthProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "입력값이 올바르지 않습니다." };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return { success: false, message: "인증 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const fallbackName = session.user.email.split("@")[0];
  const { error } = await supabase.from("user").upsert(
    {
      oauth_id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? fallbackName,
      display_name: parsed.data.displayName,
      birth: parsed.data.birth,
      phone: parsed.data.phone,
      gender: parsed.data.gender,
    },
    { onConflict: "oauth_id" },
  );

  if (error) return { success: false, message: error.message };
  return { success: true };
}
