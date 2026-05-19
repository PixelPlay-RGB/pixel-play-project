// 서버 컴포넌트에서 사용할 현재 프로필 snapshot 조회를 관리합니다.
import { createClient } from "@/lib/supabase/server";
import type { DBUser } from "@/types/profile/user";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

export type CurrentProfileSnapshot = Pick<
  DBUser,
  "id" | "nickname" | "photo_url" | "linked_providers"
>;

export interface CurrentProfileSnapshotState {
  hasAuthUser: boolean;
  profile: CurrentProfileSnapshot | null;
}

export async function getCurrentProfileSnapshot(): Promise<CurrentProfileSnapshotState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("현재 프로필 snapshot 조회 중 인증 유저 조회 실패", userError);
  }

  if (!user) {
    return {
      hasAuthUser: false,
      profile: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user")
    .select("id, nickname, photo_url, linked_providers")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("현재 프로필 snapshot 조회 실패", profileError);
    return {
      hasAuthUser: true,
      profile: null,
    };
  }

  return {
    hasAuthUser: true,
    profile,
  };
}
