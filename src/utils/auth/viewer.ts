// 현재 시청자 id를 조회하는 서버 전용 유틸입니다. (비로그인이면 null)
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

// 공개 페이지의 isLiked/isFollowing 계산에 사용합니다.
export async function resolveViewerId(): Promise<string | null> {
  const serverClient = await createClient();
  const {
    data: { user },
    error,
  } = await serverClient.auth.getUser();

  if (error && !isAuthSessionMissingError(error)) {
    console.error("시청자 조회 실패", error);
  }

  return user?.id ?? null;
}
