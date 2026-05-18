"use client";
// use-profile 훅을 제공합니다.

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import type { AuthUser, DBUser } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { AppMessageCode } from "@/constants/app-message-code";
import { resolveSupabaseErrorCode } from "@/utils/app-message";
import { isAuthSessionMissingError } from "@/utils/auth-error";

type MissingProfileReason = "auth" | "profile";

interface ProfileQuerySnapshot {
  profile: DBUser | null;
  missingReason: MissingProfileReason | null;
}

class ProfileQueryError extends Error {
  readonly code: AppMessageCode;

  constructor(code: AppMessageCode) {
    super(code);
    this.name = "ProfileQueryError";
    this.code = code;
  }
}

async function resolveAuthUser(
  storedUser: AuthUser | null,
  setUser: (user: AuthUser | null) => void,
): Promise<AuthUser | null> {
  if (storedUser) {
    return storedUser;
  }

  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && !isAuthSessionMissingError(error)) {
    console.error("프로필 조회 중 인증 유저 조회 실패", error);
  }

  if (user) {
    setUser(user);
  }

  return user;
}

async function fetchProfileSnapshot(
  storedUser: AuthUser | null,
  setUser: (user: AuthUser | null) => void,
): Promise<ProfileQuerySnapshot> {
  const authUser = await resolveAuthUser(storedUser, setUser);

  if (!authUser) {
    return {
      profile: null,
      missingReason: "auth",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    console.error("프로필 조회 실패", error);
    throw error;
  }

  return {
    profile: data,
    missingReason: data ? null : "profile",
  };
}

function selectRequiredProfile(snapshot: ProfileQuerySnapshot): DBUser {
  if (snapshot.profile) {
    return snapshot.profile;
  }

  const code =
    snapshot.missingReason === "auth"
      ? APP_MESSAGE_CODE.error.auth.authInfoNotFound
      : APP_MESSAGE_CODE.error.profile.notFound;

  throw new ProfileQueryError(code);
}

function selectNullableProfile(snapshot: ProfileQuerySnapshot): DBUser | null {
  return snapshot.profile;
}

export function resolveProfileQueryErrorCode(error: unknown): AppMessageCode {
  if (error instanceof ProfileQueryError) {
    return error.code;
  }

  return resolveSupabaseErrorCode(error, APP_MESSAGE_CODE.error.profile.notFound);
}

/**
 * 현재 로그인된 유저의 public.user 프로필을 필수 데이터로 조회.
 * - AuthUser(Zustand)가 준비되면 자동 실행
 * - 5분간 캐싱 → 여러 컴포넌트에서 호출해도 네트워크 1회
 * - 프로필 업데이트 후에는 `queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profiles() })`로 갱신
 */
export function useUser() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery<ProfileQuerySnapshot, Error, DBUser>({
    queryKey: QUERY_KEYS.auth.profile(user?.id),
    queryFn: () => fetchProfileSnapshot(user, setUser),
    select: selectRequiredProfile,
    staleTime: user ? 1000 * 60 * 5 : 0,
    refetchOnMount: "always",
  });
}

/**
 * 인증 또는 프로필 미생성 상태가 정상인 화면에서만 public.user 프로필을 nullable로 조회.
 */
export function useNullableUser() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery<ProfileQuerySnapshot, Error, DBUser | null>({
    queryKey: QUERY_KEYS.auth.profile(user?.id),
    queryFn: () => fetchProfileSnapshot(user, setUser),
    select: selectNullableProfile,
    staleTime: user ? 1000 * 60 * 5 : 0,
    refetchOnMount: "always",
  });
}
