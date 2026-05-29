// 라이브 목록 화면에서 사용하는 도메인 타입을 정의합니다.

export type LiveListFilter = "ALL" | "FOLLOWING" | "RECENT" | "ACTIVE_CHAT";

export type LiveListSort = "VIEWER_COUNT_DESC" | "STARTED_AT_DESC" | "RECENT_CHAT_DESC";

export interface LiveHeroItem {
  id: string;
  creatorId: string;
  creatorNickname: string;
  creatorPhotoUrl: string | null;
  title: string;
  tags: string[];
  thumbnailUrl: string | null;
  currentViewerCount: number;
  startedAt: string;
}

export interface LiveListItem extends LiveHeroItem {
  recentChatCount: number;
  isFollowing: boolean;
}

export interface LiveListSnapshot {
  items: LiveListItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface LivePopularKeywordItem {
  keyword: string;
  liveCount: number;
  viewerCount: number;
}

export interface LivePopularKeywordSnapshot {
  items: LivePopularKeywordItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface FollowingChannelItem {
  creatorId: string;
  creatorNickname: string;
  creatorPhotoUrl: string | null;
  followedAt: string;
  isLive: boolean;
  liveId: string | null;
  liveTitle: string | null;
  thumbnailUrl: string | null;
  currentViewerCount: number;
  startedAt: string | null;
}

export interface FollowingChannelSnapshot {
  items: FollowingChannelItem[];
  totalCount: number;
  hasMore: boolean;
}
