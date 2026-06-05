// 라이브 플레이어의 예상 가능한 브라우저 재생 실패를 판별합니다.

const EXPECTED_LIVE_PLAYBACK_ERROR_NAMES = new Set([
  "AbortError",
  "NotAllowedError",
  "NotSupportedError",
]);
const EXPECTED_LIVE_PLAYBACK_ERROR_MESSAGE_PATTERNS = [
  "failed to load",
  "interrupted by a new load request",
  "no supported source",
];

function getErrorField(error: unknown, key: "message" | "name") {
  if (error instanceof Error || error instanceof DOMException) {
    return error[key];
  }

  if (typeof error !== "object" || error === null || !(key in error)) {
    return null;
  }

  const value = (error as Partial<Record<"message" | "name", unknown>>)[key];

  return typeof value === "string" ? value : null;
}

export function isExpectedLivePlaybackError(error: unknown) {
  const errorName = getErrorField(error, "name");

  if (errorName && EXPECTED_LIVE_PLAYBACK_ERROR_NAMES.has(errorName)) {
    return true;
  }

  const message = getErrorField(error, "message")?.toLowerCase();

  return EXPECTED_LIVE_PLAYBACK_ERROR_MESSAGE_PATTERNS.some((pattern) =>
    message?.includes(pattern),
  );
}
