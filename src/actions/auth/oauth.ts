"use server";
// OAuth 프로필 완성과 OAuth 연동 해제 Server Action을 관리합니다.
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { checkNicknameExists } from "@/actions/auth/shared";
import type { ActionResponse } from "@/types/common/action";
import { createClient } from "@/lib/supabase/server";
import { completeOAuthProfileSchema } from "@/lib/zod/auth";
import type { CompleteOAuthProfileInput, LoginProvider, OAuthProvider } from "@/types/auth/auth";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { revalidatePath } from "next/cache";

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
      display_name: nickname,
      name,
    },
  });

  if (authError) {
    console.error("OAuth 프로필 완성 중 인증 정보 업데이트 실패", authError);
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoUpdateFailed };
  }

  const nicknameCheck = await checkNicknameExists(nickname);
  if (!nicknameCheck.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.nicknameCheckFailed };
  }

  if (nicknameCheck.exists) {
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

  const currentProviders = dbUser.linked_providers ?? [];
  const updatedProviders = currentProviders.filter((p) => p !== provider);

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
