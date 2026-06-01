// 팔로잉 채널 페이지 관련 상수를 정의합니다.

import type { FollowingChannelFilter } from "@/types/following/following-page";

// RPC가 한 번에 반환하는 페이지 크기 (서버 캡은 48).
export const FOLLOWING_PAGE_SIZE = 24;

interface FollowingFilterTab {
  value: FollowingChannelFilter;
  label: string;
}

export const FOLLOWING_FILTER_TABS: FollowingFilterTab[] = [
  { value: "ALL", label: "전체" },
  { value: "LIVE", label: "라이브 중" },
];
