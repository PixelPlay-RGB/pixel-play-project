// 공개 채널 프로필에 표시할 시청자 구독 상태와 배지 정보를 생성합니다.
import type { ChannelProfileSubscription } from "@/types/channel/channel";
import type { CreatorSubscriptionStatus } from "@/types/live/live";
import {
  getLiveSubscriptionBadgeSourcesByMonth,
  type LiveSubscriptionBadgeAssetInfo,
} from "@/utils/live/live-subscription-badge";
import { isSubscriptionBenefitActive } from "@/utils/subscriptions/user-subscription-status";

export interface ChannelProfileSubscriptionRow {
  status: CreatorSubscriptionStatus;
  end_at: string;
}

interface ChannelProfileSubscriptionSnapshotOptions {
  creatorId: string;
  subscription: ChannelProfileSubscriptionRow | null;
  badgeAssets: LiveSubscriptionBadgeAssetInfo;
  now?: Date;
}

export function createChannelProfileSubscriptionSnapshot({
  creatorId,
  subscription,
  badgeAssets,
  now = new Date(),
}: ChannelProfileSubscriptionSnapshotOptions): ChannelProfileSubscription {
  return {
    isSubscribed: subscription
      ? isSubscriptionBenefitActive(toBenefitInput(subscription), now)
      : false,
    status: subscription?.status ?? null,
    customMonths: badgeAssets.customMonths,
    version: badgeAssets.version,
    imageSourcesByMonth: getLiveSubscriptionBadgeSourcesByMonth(creatorId, badgeAssets),
  };
}

export function createEmptyChannelProfileSubscriptionSnapshot(
  creatorId: string,
): ChannelProfileSubscription {
  return createChannelProfileSubscriptionSnapshot({
    creatorId,
    subscription: null,
    badgeAssets: {
      customMonths: [],
      availableMonths: [],
      version: null,
    },
  });
}

function toBenefitInput(subscription: ChannelProfileSubscriptionRow) {
  return {
    status: subscription.status,
    endAt: subscription.end_at,
  };
}
