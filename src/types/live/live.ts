// 라이브 목록 화면에서 사용하는 도메인 타입을 정의합니다.

import type { GenericTables } from "@/types/common/supabase.types";

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

export type LiveBroadcastRow = GenericTables<"live_broadcast">;
export type LiveMessageRow = GenericTables<"live_message">;
export type DonationRow = GenericTables<"donation">;
export type LiveOverlayKind = "chat" | "donation";

export interface LiveBroadcastSummary {
  id: LiveBroadcastRow["id"];
  title: LiveBroadcastRow["title"];
  creatorId: LiveBroadcastRow["creator_id"];
  currentViewerCount: LiveBroadcastRow["current_viewer_count"];
  startedAt: LiveBroadcastRow["started_at"];
}

export interface LiveOverlayRouteParams {
  creatorId: string;
  overlayKey: string;
}

export type LiveChatMessageType = "text" | "donation" | "system" | "filtered";

export interface LiveChatMessage {
  id: string;
  type: LiveChatMessageType;
  author?: string;
  content: string;
  donationAmount?: number;
}

export interface LiveDonation {
  id: string;
  author: string;
  amount: number;
  message: string;
}

export type LivePollStatus = "active" | "ended";

export interface LivePollOption {
  id: string;
  label: string;
  count: number;
}

export interface LivePoll {
  id: string;
  title: string;
  options: LivePollOption[];
  status: LivePollStatus;
  totalCount: number;
  userVotedOptionId: string | null;
}

export interface LiveCreator {
  id: string;
  name: string;
  avatarUrl: string | null;
  followerCount: number;
  broadcastCount: number;
}

export interface LiveBroadcast {
  id: string;
  creatorId: string;
  title: string;
  tags: string[];
  viewerCount: number;
  elapsedSeconds: number;
  creator: LiveCreator;
}

// --- get_live_watch RPC 응답 타입 ---
export interface LiveWatchCreator {
  id: string;
  nickname: string;
  photoUrl: string | null;
  followerCount: number;
  broadcastCount: number;
}

export interface LiveWatchBroadcast {
  id: string;
  title: string;
  tags: string[];
  thumbnailUrl: string | null;
  startedAt: string;
  currentViewerCount: number;
  peakViewerCount: number;
  chatMessageCount: number;
  donationCount: number;
  donationAmountTotal: number;
}

export interface LiveWatchSettings {
  chatScope: "authenticated" | "follower" | "manager";
  followerWaitSeconds: number;
  slowModeEnabled: boolean;
  slowModeSeconds: number;
  linkBlocked: boolean;
  chatRuleText: string;
  chatRuleVersion: number;
  donationEnabled: boolean;
  donationMinAmount: number;
  donationAmountVisible: boolean;
}

export interface LiveWatchViewerRelation {
  isFollowing: boolean;
  followedAt: string | null;
  chatRuleAcceptedVersion: number | null;
  chatRuleAcceptedAt: string | null;
}

// RPC가 계산해 주는 채팅 불가 사유 — 차단/블랙리스트가 아닌 채팅 가능 여부 판단용
export type LiveChatUnavailableReason =
  | "login_required"
  | "live_offline"
  | "manager_only"
  | "follower_required"
  | "follower_wait_required"
  | "chat_rule_acceptance_required"
  | "slow_mode_required";

export interface LiveViewerChatState {
  canChat: boolean;
  chatUnavailableReason: LiveChatUnavailableReason | null;
  remainingFollowWaitSeconds: number;
  remainingSlowModeSeconds: number;
}

export interface LiveWatchData {
  creator: LiveWatchCreator;
  broadcast: LiveWatchBroadcast | null;
  settings: LiveWatchSettings;
  viewerRelation: LiveWatchViewerRelation | null;
  viewerChatState: LiveViewerChatState;
}

export function mapLiveWatchToBroadcast(data: LiveWatchData | null | undefined): LiveBroadcast | null {
  if (!data?.broadcast) return null;

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(data.broadcast.startedAt).getTime()) / 1000),
  );

  return {
    id: data.broadcast.id,
    creatorId: data.creator.id,
    title: data.broadcast.title,
    tags: data.broadcast.tags,
    viewerCount: data.broadcast.currentViewerCount,
    elapsedSeconds,
    creator: {
      id: data.creator.id,
      name: data.creator.nickname,
      avatarUrl: data.creator.photoUrl,
      followerCount: data.creator.followerCount,
      broadcastCount: data.creator.broadcastCount,
    },
  };
}
