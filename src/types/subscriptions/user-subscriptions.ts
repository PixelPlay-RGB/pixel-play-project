// 사용자 구독 관리 화면에서 사용하는 구독 스냅샷 타입을 정의합니다.
import type { CreatorSubscriptionStatus } from "@/types/live/live";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";

export interface UserSubscriptionBadgeSnapshot {
  customMonths: number[];
  availableMonths: number[];
  version: string | null;
  imageSourcesByMonth: Record<number, string>;
}

export interface UserSubscriptionItem {
  id: string;
  creatorId: string;
  creatorNickname: string;
  creatorPhotoUrl: string | null;
  startedAt: string;
  endAt: string;
  totalMonths: number;
  status: CreatorSubscriptionStatus;
  isActive: boolean;
  badge: UserSubscriptionBadgeSnapshot;
  emojis: ChannelEmoji[];
}

export interface UserSubscriptionSnapshot {
  activeSubscriptions: UserSubscriptionItem[];
  expiredSubscriptions: UserSubscriptionItem[];
}
