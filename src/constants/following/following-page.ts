// 팔로잉 채널 페이지 관련 상수를 정의합니다.

import type { FollowingChannelFilter } from "@/types/following/following-page";

// 한 페이지에 보여줄 팔로잉 채널 수 (서버 캡은 50).
export const FOLLOWING_PAGE_SIZE = 10;

interface FollowingFilterTab {
  value: FollowingChannelFilter;
  label: string;
}

export const FOLLOWING_FILTER_TABS: FollowingFilterTab[] = [
  { value: "ALL", label: "전체" },
  { value: "LIVE", label: "라이브 중" },
];

// 팔로잉 목록 빈 상태 안내 문구.
export const FOLLOWING_EMPTY_MESSAGES = {
  noFollowing: {
    title: "아직 팔로우한 크리에이터가 없어요",
    description: "관심 있는 채널을 팔로우하면 이곳에서 모아볼 수 있어요.",
  },
  noLive: {
    title: "지금 라이브 중인 채널이 없어요",
    description: "팔로우한 크리에이터가 방송을 시작하면 여기에 표시돼요.",
  },
} as const;
