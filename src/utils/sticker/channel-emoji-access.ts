// 채널 이모지 토큰 사용에 필요한 구독 권한 누락을 판정합니다.

export interface ChannelEmojiOwner {
  id: string;
  creatorId: string;
}

export function getMissingChannelEmojiSubscriptionCreatorIds({
  tokenIds,
  emojiOwners,
  subscribedCreatorIds,
}: {
  tokenIds: readonly string[];
  emojiOwners: readonly ChannelEmojiOwner[];
  subscribedCreatorIds: readonly string[];
}): string[] {
  const tokenIdSet = new Set(tokenIds);
  const subscribedCreatorIdSet = new Set(subscribedCreatorIds);
  const missingCreatorIds = new Set<string>();

  for (const emojiOwner of emojiOwners) {
    if (!tokenIdSet.has(emojiOwner.id)) continue;
    if (!subscribedCreatorIdSet.has(emojiOwner.creatorId)) {
      missingCreatorIds.add(emojiOwner.creatorId);
    }
  }

  return [...missingCreatorIds];
}
