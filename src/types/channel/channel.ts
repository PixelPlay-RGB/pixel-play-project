// 공개 채널 페이지(치지직형)의 크리에이터 프로필/배너 타입을 정의합니다.

import type { CreatorSubscriptionStatus } from "@/types/live/live";

export interface ChannelProfileSubscription {
  isSubscribed: boolean;
  status: CreatorSubscriptionStatus | null;
  customMonths: number[];
  version: string | null;
  imageSourcesByMonth: Record<number, string>;
}

export interface ChannelProfile {
  id: string;
  nickname: string;
  photoUrl: string | null;
  followerCount: number;
  isFollowing: boolean;
  // 시청자가 곧 채널 주인인지 여부(팔로우 버튼 → "내 채널").
  isOwnChannel: boolean;
  // 채널 소개글(없으면 null).
  bio: string | null;
  // 현재 라이브 방송 중인지.
  isLive: boolean;
  subscription: ChannelProfileSubscription;
}

// 채널 홈 배너(이미지 + 외부 링크).
export interface ChannelBanner {
  id: string;
  imageUrl: string;
  title: string;
  linkUrl: string;
  sortOrder: number;
}
