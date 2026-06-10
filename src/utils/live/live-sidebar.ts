// 라이브 Sidebar RPC 응답을 파싱합니다.

import type {
  FollowingChannelItem,
  FollowingChannelSnapshot,
  LivePopularKeywordItem,
  LivePopularKeywordSnapshot,
} from "@/types/live/live";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(object: JsonObject, key: string): string {
  const value = object[key];

  if (typeof value !== "string") {
    throw new Error(`라이브 Sidebar 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readNullableString(object: JsonObject, key: string): string | null {
  const value = object[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`라이브 Sidebar 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readNumber(object: JsonObject, key: string): number {
  const value = object[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`라이브 Sidebar 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readBoolean(object: JsonObject, key: string): boolean {
  const value = object[key];

  if (typeof value !== "boolean") {
    throw new Error(`라이브 Sidebar 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readSnapshotBase(value: unknown) {
  if (!isJsonObject(value)) {
    throw new Error("라이브 Sidebar 응답 형식이 올바르지 않습니다.");
  }

  const items = value.items;

  if (!Array.isArray(items)) {
    throw new Error("라이브 Sidebar items 값이 올바르지 않습니다.");
  }

  return {
    items,
    totalCount: readNumber(value, "totalCount"),
    hasMore: readBoolean(value, "hasMore"),
  };
}

function parsePopularKeywordItem(value: unknown): LivePopularKeywordItem {
  if (!isJsonObject(value)) {
    throw new Error("인기 키워드 데이터 형식이 올바르지 않습니다.");
  }

  return {
    keyword: readString(value, "keyword"),
    liveCount: readNumber(value, "liveCount"),
    viewerCount: readNumber(value, "viewerCount"),
  };
}

export function parseLivePopularKeywordSnapshot(value: unknown): LivePopularKeywordSnapshot {
  const snapshot = readSnapshotBase(value);

  return {
    items: snapshot.items.map(parsePopularKeywordItem),
    totalCount: snapshot.totalCount,
    hasMore: snapshot.hasMore,
  };
}

function parseFollowingChannelItem(value: unknown): FollowingChannelItem {
  if (!isJsonObject(value)) {
    throw new Error("팔로잉 채널 데이터 형식이 올바르지 않습니다.");
  }

  return {
    creatorId: readString(value, "creatorId"),
    creatorNickname: readString(value, "creatorNickname"),
    creatorPhotoUrl: readNullableString(value, "creatorPhotoUrl"),
    followedAt: readString(value, "followedAt"),
    isLive: readBoolean(value, "isLive"),
    liveId: readNullableString(value, "liveId"),
    liveTitle: readNullableString(value, "liveTitle"),
    thumbnailUrl: readNullableString(value, "thumbnailUrl"),
    currentViewerCount: readNumber(value, "currentViewerCount"),
    startedAt: readNullableString(value, "startedAt"),
  };
}

export function parseFollowingChannelSnapshot(value: unknown): FollowingChannelSnapshot {
  const snapshot = readSnapshotBase(value);

  return {
    items: snapshot.items.map(parseFollowingChannelItem),
    totalCount: snapshot.totalCount,
    hasMore: snapshot.hasMore,
  };
}
