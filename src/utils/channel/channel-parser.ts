// 채널 프로필/배너 RPC(jsonb) 응답을 화면 타입으로 변환합니다.
import type { ChannelBanner, ChannelProfile } from "@/types/channel/channel";
import type { Json } from "@/types/database.types";
import { getChannelBannerSrc } from "@/utils/channel/channel-banner";

function readObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function readArray(value: Json | undefined): Json[] {
  return Array.isArray(value) ? value : [];
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
    bio: readString(object.bio),
    isLive: readBoolean(object.isLive),
  };
}

// get_channel_banners jsonb([{ id, imagePath, title, linkUrl, sortOrder }]) → ChannelBanner[].
export function parseChannelBanners(value: Json): ChannelBanner[] {
  return readArray(value)
    .map((item) => {
      const object = readObject(item);
      if (!object) {
        return null;
      }
      const id = readString(object.id);
      const imagePath = readString(object.imagePath);
      const linkUrl = readString(object.linkUrl);
      if (!id || !imagePath || !linkUrl) {
        return null;
      }
      return {
        id,
        imageUrl: getChannelBannerSrc(imagePath),
        title: readString(object.title) ?? "",
        linkUrl,
        sortOrder: readNumber(object.sortOrder),
      } satisfies ChannelBanner;
    })
    .filter((item): item is ChannelBanner => item !== null);
}
