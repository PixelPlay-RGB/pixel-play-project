// 도메인 무관 JSON/JSONB 값 파싱 헬퍼입니다.

import type { Json } from "@/types/database.types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function readJsonObject(value: Json): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json | undefined>;
}

export function readString(value: Json | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed.length > 0 ? trimmed : null;
}

export function readNumber(value: Json | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
