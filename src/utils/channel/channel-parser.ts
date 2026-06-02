// 채널 프로필 RPC(jsonb) 응답을 화면 타입으로 변환합니다.
import type { ChannelProfile } from "@/types/channel/channel";
import type { Json } from "@/types/database.types";

function readObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function readString(value: Json | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: Json | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readBoolean(value: Json | undefined): boolean {
  return value === true;
}

export function parseChannelProfile(value: Json, viewerId: string | null): ChannelProfile | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);

  if (!id) {
    return null;
  }

  return {
    id,
    nickname: readString(object.nickname) ?? "크리에이터",
    photoUrl: readString(object.photoUrl),
    followerCount: readNumber(object.followerCount),
    isFollowing: readBoolean(object.isFollowing),
    isOwnChannel: viewerId !== null && viewerId === id,
  };
}
