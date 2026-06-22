// 채널 운영(매니저 권한 / 시청자 제재) 도메인 타입.
// RPC jsonb 응답을 정규화한 앱 도메인 모델이며, 정규화는 utils/channel/channel-moderation.ts 가 담당한다.

// get_channel_managers 의 item — 활성 매니저 관계 1건(최신 닉네임/사진은 user 조인 결과).
export interface ChannelManagerItem {
  managerRelationId: string;
  managerId: string;
  managerNickname: string;
  managerPhotoUrl: string | null;
  createdById: string | null;
  createdByNickname: string | null;
  createdAt: string;
}

// search_channel_users 의 후보 — 닉네임 또는 이메일 정확일치로 찾은 유저.
export interface ChannelUserCandidate {
  userId: string;
  nickname: string;
  photoUrl: string | null;
  email: string | null;
}

// 권한 화면 목록 맨 위에 고정하는 스트리머 본인(크리에이터) 식별 정보.
export interface ChannelOwnerIdentity {
  id: string;
  nickname: string;
  photoUrl: string | null;
}

// get_channel_viewer_bans 의 item — 강퇴/밴 이력 1건. 닉네임은 사건 시점 스냅샷이다(#119).
export interface ChannelViewerBanItem {
  banId: string;
  bannedUserId: string;
  bannedUserNickname: string;
  bannedByNickname: string | null;
  bannedAt: string;
  unbannedAt: string | null;
  // 활성 밴 여부(unbanned_at is null). 해제 버튼은 활성 행에만 노출한다.
  isActive: boolean;
}

// get_channel_viewer_bans 응답 — 페이지네이션용 items + 전체 개수.
export interface ChannelViewerBanList {
  items: ChannelViewerBanItem[];
  totalCount: number;
}

export type LiveViewerRole = "creator" | "manager" | "viewer";

// get_live_viewer_profile — 닉네임 팝업용 시청자 프로필(#119).
// role 은 메시지 스냅샷이 아니라 "현재" 역할이라 강퇴 버튼 가드 판정에 쓴다.
export interface LiveViewerProfile {
  userId: string;
  nickname: string;
  photoUrl: string | null;
  followedAt: string | null;
  role: LiveViewerRole;
}
