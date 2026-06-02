// 팔로잉 채널 페이지 RPC 응답을 파싱합니다.

import type {
  FollowingChannelPageItem,
  FollowingChannelPageSnapshot,
} from "@/types/following/following-page";

type JsonObject = Record<string, unknown>;

export const EMPTY_FOLLOWING_CHANNEL_PAGE_SNAPSHOT: FollowingChannelPageSnapshot = {
  items: [],
  totalCount: 0,
  liveCount: 0,
  recentBroadcastCount: 0,
  filteredCount: 0,
};

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(object: JsonObject, key: string): string {
  const value = object[key];

  if (typeof value !== "string") {
    throw new Error(`팔로잉 채널 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readNullableString(object: JsonObject, key: string): string | null {
  if (!(key in object)) {
    throw new Error(`팔로잉 채널 데이터에 ${key} 키가 없습니다.`);
  }

  const value = object[key];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`팔로잉 채널 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readNumber(object: JsonObject, key: string): number {
  const value = object[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`팔로잉 채널 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function readBoolean(object: JsonObject, key: string): boolean {
  const value = object[key];

  if (typeof value !== "boolean") {
    throw new Error(`팔로잉 채널 데이터의 ${key} 값이 올바르지 않습니다.`);
  }

  return value;
}

function parseFollowingChannelPageItem(value: unknown): FollowingChannelPageItem {
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
    lastBroadcastAt: readNullableString(value, "lastBroadcastAt"),
  };
}

export function parseFollowingChannelPageSnapshot(value: unknown): FollowingChannelPageSnapshot {
  if (!isJsonObject(value)) {
    throw new Error("팔로잉 채널 응답 형식이 올바르지 않습니다.");
  }

  const items = value.items;

  if (!Array.isArray(items)) {
    throw new Error("팔로잉 채널 items 값이 올바르지 않습니다.");
  }

  return {
    items: items.map(parseFollowingChannelPageItem),
    totalCount: readNumber(value, "totalCount"),
    liveCount: readNumber(value, "liveCount"),
    recentBroadcastCount: readNumber(value, "recentBroadcastCount"),
    filteredCount: readNumber(value, "filteredCount"),
  };
}
