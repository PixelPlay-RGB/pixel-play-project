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
