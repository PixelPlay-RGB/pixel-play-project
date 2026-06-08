// 통계 화면(실시간·지난 방송)의 데이터 주체 user id를 해석합니다.
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

// 로그인한 크리에이터 본인을 통계 데이터 주체로 쓴다.
export async function resolveAnalyticsActorId(): Promise<string | null> {
  const serverClient = await createClient();
  const {
    data: { user },
    error,
  } = await serverClient.auth.getUser();

  if (error && !isAuthSessionMissingError(error)) {
    console.error("통계 actor 조회 중 인증 유저 조회 실패", error);
  }

  return user?.id ?? null;
}
