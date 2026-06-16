// 라이브 구독 모달에 표시할 방송인 이모티콘 목록을 정리합니다.

import type { LiveSubscriptionEmote } from "../../types/live/live";

const LIVE_SUBSCRIPTION_EMOTE_BUCKET = "user-media";
export const LIVE_SUBSCRIPTION_EMOTE_STORAGE_FOLDER = "emoticon";
const LIVE_SUBSCRIPTION_EMOTE_FILE_PATTERN = /\.(?:png|jpe?g|webp|gif)$/i;

interface LiveSubscriptionEmoteStorageFile {
  name: string;
  updated_at?: string | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
}

function readStorageFileVersion(file: LiveSubscriptionEmoteStorageFile) {
  const version = file.updated_at ?? file.created_at ?? file.last_accessed_at ?? null;

  if (!version || Number.isNaN(Date.parse(version))) {
    return null;
  }

  return version;
}

function appendPublicUrlVersion(src: string, version: string | null) {
  if (!version) return src;

  return `${src}${src.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
}

function getSubscriptionEmotePublicUrl(path: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/${LIVE_SUBSCRIPTION_EMOTE_BUCKET}/${encodedPath}`;
}

function readEmoteLabel(fileName: string) {
  return fileName.replace(LIVE_SUBSCRIPTION_EMOTE_FILE_PATTERN, "");
}

export function readLiveSubscriptionEmotes(
  creatorId: string,
  files: readonly LiveSubscriptionEmoteStorageFile[] | null,
): LiveSubscriptionEmote[] {
  return (files ?? [])
    .filter((file) => LIVE_SUBSCRIPTION_EMOTE_FILE_PATTERN.test(file.name))
    .map((file) => {
      const updatedAt = readStorageFileVersion(file);
      const path = `${creatorId}/${LIVE_SUBSCRIPTION_EMOTE_STORAGE_FOLDER}/${file.name}`;
      const src = appendPublicUrlVersion(getSubscriptionEmotePublicUrl(path), updatedAt);

      return {
        name: readEmoteLabel(file.name),
        src,
        updatedAt,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
}
