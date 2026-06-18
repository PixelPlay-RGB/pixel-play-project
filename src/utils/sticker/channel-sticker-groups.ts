// 채널 이모지를 방송인 프로필별 피커 그룹으로 정리합니다.
import type { ChannelStickerGroup, Sticker } from "../../types/sticker/sticker.ts";

export interface ChannelStickerGroupProfile {
  id: string;
  nickname: string | null;
  photoUrl: string | null;
}

export interface ChannelStickerGroupSticker {
  creatorId: string;
  sticker: Sticker;
}

const UNKNOWN_CHANNEL_LABEL = "알 수 없음";

export function createChannelStickerGroups({
  creatorIds,
  profiles,
  stickers,
}: {
  creatorIds: readonly string[];
  profiles: readonly ChannelStickerGroupProfile[];
  stickers: readonly ChannelStickerGroupSticker[];
}): ChannelStickerGroup[] {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const stickersByCreatorId = new Map<string, Sticker[]>();

  for (const item of stickers) {
    const list = stickersByCreatorId.get(item.creatorId) ?? [];
    list.push(item.sticker);
    stickersByCreatorId.set(item.creatorId, list);
  }

  const seenCreatorIds = new Set<string>();
  const groups: ChannelStickerGroup[] = [];

  for (const creatorId of creatorIds) {
    if (seenCreatorIds.has(creatorId)) continue;
    seenCreatorIds.add(creatorId);

    const creatorStickers = stickersByCreatorId.get(creatorId) ?? [];
    if (creatorStickers.length === 0) continue;

    const profile = profileById.get(creatorId);
    const nickname = profile?.nickname?.trim();

    groups.push({
      creatorId,
      label: nickname ? nickname : UNKNOWN_CHANNEL_LABEL,
      avatarUrl: profile?.photoUrl ?? null,
      stickers: creatorStickers,
    });
  }

  return groups;
}
