// 라이브 목록 RPC 응답 파싱과 표시용 포맷을 제공합니다.

import { LIVE_THUMBNAIL_FALLBACK_URLS } from "@/constants/live/live-list";
import type { LiveHeroItem, LiveListItem, LiveListSnapshot } from "@/types/live/live";
import { formatNumber } from "@/utils/common/format";
import { hashStringToIndex } from "@/utils/common/hash";

// Supabase 스토리지 호스트는 프로젝트 URL에서 도출해 환경이 바뀌어도 썸네일이 깨지지 않게 한다.
// env가 비었거나 비URL이면 모듈 로드 시 throw가 나서 이 모듈을 import하는 모든 화면(라이브 목록·Hero·
// 썸네일·시청자수 포맷)이 동반 폭발하므로, 호스트 도출 실패는 ""로 흘려 폴백 썸네일로만 떨어지게 한다.
function resolveSupabaseHostname(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    return "";
  }

  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

const SUPABASE_HOSTNAME = resolveSupabaseHostname();
const SAFE_THUMBNAIL_HOSTS = new Set([SUPABASE_HOSTNAME, "images.unsplash.com"]);

export const EMPTY_LIVE_LIST_SNAPSHOT: LiveListSnapshot = {
  items: [],
  totalCount: 0,
  hasMore: false,
};

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(object: JsonObject, key: string): string {
  const value = object[key];

  if (typeof value !== "string") {
    throw new Error(`라이브 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readNullableString(object: JsonObject, key: string): string | null {
  const value = object[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`라이브 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readNumber(object: JsonObject, key: string): number {
  const value = object[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`라이브 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readBoolean(object: JsonObject, key: string): boolean {
  const value = object[key];

  if (typeof value !== "boolean") {
    throw new Error(`라이브 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readStringArray(object: JsonObject, key: string): string[] {
  const value = object[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function parseLiveHeroLike(value: unknown): LiveHeroItem {
  if (!isJsonObject(value)) {
    throw new Error("라이브 데이터 형식이 올바르지 않습니다.");
  }

  return {
    id: readString(value, "id"),
    creatorId: readString(value, "creatorId"),
    creatorNickname: readString(value, "creatorNickname"),
    creatorPhotoUrl: readNullableString(value, "creatorPhotoUrl"),
    title: readString(value, "title"),
    tags: readStringArray(value, "tags"),
    thumbnailUrl: readNullableString(value, "thumbnailUrl"),
    currentViewerCount: readNumber(value, "currentViewerCount"),
    startedAt: readString(value, "startedAt"),
    isFollowing: readBoolean(value, "isFollowing"),
  };
}

export function parseLiveHeroItem(value: unknown): LiveHeroItem | null {
  if (value === null) {
    return null;
  }

  return parseLiveHeroLike(value);
}

function parseLiveListItem(value: unknown): LiveListItem {
  const baseItem = parseLiveHeroLike(value);

  if (!isJsonObject(value)) {
    throw new Error("라이브 목록 데이터 형식이 올바르지 않습니다.");
  }

  return {
    ...baseItem,
    recentChatCount: readNumber(value, "recentChatCount"),
  };
}

export function parseLiveListSnapshot(value: unknown): LiveListSnapshot {
  if (!isJsonObject(value)) {
    throw new Error("라이브 목록 응답 형식이 올바르지 않습니다.");
  }

  const items = value.items;

  if (!Array.isArray(items)) {
    throw new Error("라이브 목록 items 값이 올바르지 않습니다.");
  }

  return {
    items: items.map(parseLiveListItem),
    totalCount: readNumber(value, "totalCount"),
    hasMore: readBoolean(value, "hasMore"),
  };
}

function isSafeThumbnailUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && SAFE_THUMBNAIL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function getLiveThumbnailSrc(liveId: string, thumbnailUrl?: string | null) {
  const trimmedThumbnailUrl = thumbnailUrl?.trim();

  if (trimmedThumbnailUrl && isSafeThumbnailUrl(trimmedThumbnailUrl)) {
    return trimmedThumbnailUrl;
  }

  return LIVE_THUMBNAIL_FALLBACK_URLS[
    hashStringToIndex(liveId, LIVE_THUMBNAIL_FALLBACK_URLS.length)
  ];
}

export function getLiveTagLabels(tags: string[], limit = 2) {
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")
    .slice(0, limit);
}

export function createLiveSearchHref(query: string) {
  const searchParams = new URLSearchParams({ query });

  return `/live/search?${searchParams.toString()}`;
}

export function formatViewerCount(count: number) {
  return `${formatNumber(count)}명 시청`;
}

export function formatViewerCountNumber(count: number) {
  return formatNumber(count);
}

export function formatViewerCountLabel(count: number) {
  return `${formatNumber(count)}명`;
}

export function formatLiveDuration(startedAt: string) {
  const startedTime = new Date(startedAt).getTime();

  if (!Number.isFinite(startedTime)) {
    return "방송 중";
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - startedTime) / 60000));

  if (diffMinutes < 1) {
    return "방금 시작";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분째 방송 중`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}시간째 방송 중`;
  }

  return `${Math.floor(diffHours / 24)}일째 방송 중`;
}
