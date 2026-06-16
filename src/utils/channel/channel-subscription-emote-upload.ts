// 채널 구독 이모티콘 업로드 입력값과 storage 경로를 검증합니다.

export type ChannelSubscriptionEmoteTier = "common" | "plus";
export type ChannelSubscriptionEmoteTarget = "pc" | "mobile";

const CHANNEL_SUBSCRIPTION_EMOTE_TITLE_PATTERN = /^[0-9A-Za-z가-힣]+$/;
const CHANNEL_SUBSCRIPTION_EMOTE_IMAGE_TYPE_TO_EXTENSION = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const CHANNEL_SUBSCRIPTION_EMOTE_LIMIT = 6;
export const CHANNEL_SUBSCRIPTION_EMOTE_MAX_FILE_SIZE = 1 * 1024 * 1024;

export type ChannelSubscriptionEmoteExtension =
  (typeof CHANNEL_SUBSCRIPTION_EMOTE_IMAGE_TYPE_TO_EXTENSION)[keyof typeof CHANNEL_SUBSCRIPTION_EMOTE_IMAGE_TYPE_TO_EXTENSION];

interface BuildChannelSubscriptionEmoteStoragePathOptions {
  creatorId: string;
  title: string;
  tier: ChannelSubscriptionEmoteTier;
  extension: ChannelSubscriptionEmoteExtension;
  target: ChannelSubscriptionEmoteTarget;
}

export function normalizeChannelSubscriptionEmoteTitle(value: string) {
  const title = value.trim();
  if (!title || !CHANNEL_SUBSCRIPTION_EMOTE_TITLE_PATTERN.test(title)) {
    return null;
  }

  const hasKorean = /[가-힣]/.test(title);
  const maxLength = hasKorean ? 6 : 12;

  return Array.from(title).length <= maxLength ? title : null;
}

export function readChannelSubscriptionEmoteTier(
  value: FormDataEntryValue | null,
): ChannelSubscriptionEmoteTier | null {
  return value === "common" || value === "plus" ? value : null;
}

export function readChannelSubscriptionEmoteExtension(file: File) {
  return (
    CHANNEL_SUBSCRIPTION_EMOTE_IMAGE_TYPE_TO_EXTENSION[
      file.type as keyof typeof CHANNEL_SUBSCRIPTION_EMOTE_IMAGE_TYPE_TO_EXTENSION
    ] ?? null
  );
}

export function isValidChannelSubscriptionEmoteFile(file: File | null) {
  return (
    file instanceof File &&
    file.size > 0 &&
    file.size <= CHANNEL_SUBSCRIPTION_EMOTE_MAX_FILE_SIZE &&
    readChannelSubscriptionEmoteExtension(file) !== null
  );
}

export function buildChannelSubscriptionEmoteStoragePath({
  creatorId,
  title,
  tier,
  extension,
  target,
}: BuildChannelSubscriptionEmoteStoragePathOptions) {
  const fileName = `${tier === "plus" ? "plus-" : ""}${title}.${extension}`;

  return target === "pc"
    ? `${creatorId}/emoticon/${fileName}`
    : `${creatorId}/emoticon/mobile/${fileName}`;
}

export function isChannelSubscriptionEmoteStorageFileName(name: string) {
  return /\.(?:gif|jpe?g|png|webp)$/i.test(name);
}

export function isPlusChannelSubscriptionEmoteStorageFileName(name: string) {
  return /^plus-[^/]+\.(?:gif|jpe?g|png|webp)$/i.test(name);
}
