// 채널 통계 snapshot·Realtime payload 정규화에서 공유하는 read 헬퍼입니다.

export function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// readText는 필수값 판별을 위해 빈 문자열/비문자열을 null로 반환한다.
export function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}
