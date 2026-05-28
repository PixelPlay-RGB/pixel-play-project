// Supabase Auth 오류의 처리 가능 상태를 판별하는 유틸리티

export function isAuthSessionMissingError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AuthSessionMissingError"
  );
}

export function isRecoverableAuthSessionError(error: unknown) {
  if (isAuthSessionMissingError(error)) {
    return true;
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("jwt expired") ||
    normalizedMessage.includes("invalid jwt") ||
    normalizedMessage.includes("invalid refresh token") ||
    normalizedMessage.includes("refresh token not found") ||
    normalizedMessage.includes("session not found")
  );
}
