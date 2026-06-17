// 라이브 목록·시청 화면에서 사용하는 도메인 타입을 정의합니다.

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
  // 현재 시청자(로그인 유저)의 팔로우 여부. Hero 아바타 팝오버에 쓴다.
  isFollowing: boolean;
}

export interface LiveListItem extends LiveHeroItem {
  recentChatCount: number;
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

export type LiveChatMessageType = "text" | "donation" | "system";

// live_message.sender_role enum과 동일 — 전송 시점에 DB가 스냅샷한 발신자 역할.
// manager·subscriber는 추후 기능(매니저 지정·구독) 대비로 미리 둔 값이다.
export type LiveSenderRole = "creator" | "manager" | "donor" | "subscriber" | "viewer";

export interface LiveChatMessage {
  id: string;
  type: LiveChatMessageType;
  author?: string;
  content: string;
  createdAt?: string;
  donationAmount?: number;
  // 작성자 user UUID(있을 때). 발신자 신원 기반 표식에 쓴다.
  // 익명 후원·시스템 메시지에는 없다(익명 후원은 sender_id가 null로 저장됨).
  senderId?: string;
  // 전송 시점 발신자 역할 스냅샷(text 메시지). 역할 마크 표시에 쓴다.
  senderRole?: LiveSenderRole;
  // 동시에 보유한 역할들(크리에이터/매니저/후원자/구독자) — 여러 뱃지를 가로로 나열한다.
  // sender_role(precedence) + metadata(isDonor/isSubscriber)에서 매핑 단계가 합성한다.
  senderRoles?: Exclude<LiveSenderRole, "viewer">[];
  // 작성자가 방송 진행자(크리에이터) 본인인지 여부. 채팅에서 호스트 메시지를 강조하는 데 쓴다.
  isHost?: boolean;
  // 클린봇 자동 비속어 사전에 걸린 text 메시지. 클린봇 토글 ON이면 가리고 펼쳐볼 수 있다.
  // 추후 서버 승격 시 이 값의 출처만 metadata 플래그로 교체한다.
  isCleanbotFlagged?: boolean;
}

// send_live_message_v2 RPC 응답을 정규화한 결과. 금칙어로 가려지면 messageId는 null, moderated는 true.
export interface SendLiveMessageResult {
  messageId: string | null;
  moderated: boolean;
}

// 채팅 닉네임 클릭 팝업(프로필/강퇴)에 필요한 시청 컨텍스트 — 패널·본문·목록을 관통해 전달한다(#119).
// 객체 1개로 묶어 메시지 목록까지 내려보내고, 목록은 memo 보존을 위해 원시값으로 펼쳐 각 메시지에 넘긴다.
export interface LiveChatProfileContext {
  // 시청 중인 채널(크리에이터) id. 강퇴/프로필 RPC 의 p_creator_id.
  creatorId: string;
  // 현재 로그인 유저 id(비로그인 null) — 본인 메시지 강퇴 숨김 판정에 쓴다.
  viewerId: string | null;
  // 현재 유저가 이 채널의 강퇴 권한자(크리에이터/매니저)인지 — 강퇴 버튼 노출 게이트.
  canModerate: boolean;
  // 강퇴 사건 컨텍스트로 기록할 활성 방송 id(없으면 null).
  broadcastId: string | null;
}

export interface LiveDonation {
  id: string;
  author: string;
  amount: number;
}

export type LivePollStatus = "active" | "ended";

export interface LivePollOption {
  id: string;
  label: string;
  count: number;
}

export interface LivePoll {
  createdAt: string;
  id: string;
  title: string;
  options: LivePollOption[];
  status: LivePollStatus;
  endsAt: string | null;
  endedAt: string | null;
  totalCount: number;
  userVotedOptionId: string | null;
}

export type LiveInteractionNoticeType = "draw" | "roulette";
export type LiveInteractionNoticeStatus = "active" | "ended";

export interface LiveInteractionNotice {
  content: string;
  createdAt: string;
  drawNoticeId?: string;
  hasJoined?: boolean;
  id: string;
  participantCount?: number;
  participantNames?: string[];
  resultLabel?: string;
  rouletteDurationSeconds?: number;
  rouletteItems?: string[];
  rouletteRotationKeyframes?: number[];
  status: LiveInteractionNoticeStatus;
  type: LiveInteractionNoticeType;
  winnerNames?: string[];
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
  // 이 채널의 활성 매니저인지(#118) — 유저관리/매니저 채팅 분기에 쓴다.
  isManager: boolean;
  // 이 채널에서 강퇴(활성 밴)되었는지(#119) — 차단 화면 전환에 쓴다.
  isBanned: boolean;
}

// RPC가 계산해 주는 채팅 불가 사유 — 차단/블랙리스트가 아닌 채팅 가능 여부 판단용
export type LiveChatUnavailableReason =
  | "login_required"
  | "live_offline"
  | "banned"
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

// RPC의 크리에이터 응답을 UI에서 쓰는 LiveCreator로 정규화한다.
// 방송이 종료/오프라인이라 broadcast가 null이어도 크리에이터 정보는 살아 있어 종료 화면에서 쓴다.
export function mapLiveWatchCreator(creator: LiveWatchCreator): LiveCreator {
  return {
    id: creator.id,
    name: creator.nickname,
    avatarUrl: creator.photoUrl,
    followerCount: creator.followerCount,
    broadcastCount: creator.broadcastCount,
  };
}

export function mapLiveWatchToBroadcast(
  data: LiveWatchData | null | undefined,
): LiveBroadcast | null {
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
    creator: mapLiveWatchCreator(data.creator),
  };
}
