// 채널 이모지 storage 경로·URL·jsonb 파싱 유틸(배너 패턴 미러).
import type { ChannelEmoji, ChannelEmojiRow } from "../../types/channel/channel-emoji.ts";
import type { Json } from "../../types/database.types.ts";
import { getUserMediaPublicUrl, pickImageExtension } from "../storage/user-media.ts";

// user-media/{creatorId}/emoji/{uuid}.{ext}의 객체명(uuid.ext) 생성.
export function buildEmojiObjectName(mimeType: string): string {
  return `${crypto.randomUUID()}.${pickImageExtension(mimeType)}`;
}

export function getChannelEmojiSrc(imagePath: string): string {
  return getUserMediaPublicUrl(imagePath);
}

export type ChannelEmojiPreviewRow = Pick<
  ChannelEmojiRow,
  "id" | "image_path" | "name" | "sort_order"
>;

export function mapChannelEmojiRows(rows: readonly ChannelEmojiPreviewRow[]): ChannelEmoji[] {
  return rows.map((row) => ({
    id: row.id,
    imageUrl: getChannelEmojiSrc(row.image_path),
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

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

// get_channel_emojis jsonb([{ id, imagePath, name, sortOrder }]) → ChannelEmoji[].
export function parseChannelEmojis(value: Json): ChannelEmoji[] {
  return (Array.isArray(value) ? value : [])
    .map((item) => {
      const object = readObject(item);
      if (!object) {
        return null;
      }
      const id = readString(object.id);
      const imagePath = readString(object.imagePath);
      const name = readString(object.name);
      if (!id || !imagePath || !name) {
        return null;
      }
      return {
        id,
        imageUrl: getChannelEmojiSrc(imagePath),
        name,
        sortOrder: readNumber(object.sortOrder),
      } satisfies ChannelEmoji;
    })
    .filter((item): item is ChannelEmoji => item !== null);
}
