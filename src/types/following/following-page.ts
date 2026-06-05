// 팔로잉 채널 목록 페이지(/user/following)에서 사용하는 도메인 타입을 정의합니다.

import type { FollowingChannelItem } from "@/types/live/live";

// 전체 목록과 라이브 중인 채널만 보는 필터 탭을 구분합니다.
export type FollowingChannelFilter = "ALL" | "LIVE";

// 사이드바용 항목에 마지막 방송 시각(오프라인 채널의 "최근 방송" 표기용)을 추가합니다.
export interface FollowingChannelPageItem extends FollowingChannelItem {
  lastBroadcastAt: string | null;
}

export interface FollowingChannelPageSnapshot {
  items: FollowingChannelPageItem[];
  // 통계는 필터와 무관하게 전체 팔로잉 기준으로 계산합니다.
  totalCount: number;
  liveCount: number;
  recentBroadcastCount: number;
  // 현재 필터 기준 항목 수 (페이지 수 계산용).
  filteredCount: number;
}
