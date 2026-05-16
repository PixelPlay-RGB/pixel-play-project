// Supabase Auth 오류의 처리 가능 상태를 판별하는 유틸리티

export function isAuthSessionMissingError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AuthSessionMissingError"
  );
}
