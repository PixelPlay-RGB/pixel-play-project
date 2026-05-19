"use server";
// 서버 액션에서 인증된 사용자 ID를 조회하는 공용 헬퍼입니다.
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

export type AuthenticatedActorResult =
  | {
      success: true;
      userId: string;
    }
  | {
      success: false;
      result: AppActionResult;
    };

interface GetAuthenticatedActorIdOptions {
  logLabel: string;
  missingCode?: AppMessageCode;
}

export async function getAuthenticatedActorId({
  logLabel,
  missingCode = APP_MESSAGE_CODE.error.auth.authInfoNotFound,
}: GetAuthenticatedActorIdOptions): Promise<AuthenticatedActorResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && !isAuthSessionMissingError(error)) {
    console.error(logLabel, error);
  }

  if (!user) {
    return {
      success: false,
      result: {
        success: false,
        code: missingCode,
      },
    };
  }

  return {
    success: true,
    userId: user.id,
  };
}
