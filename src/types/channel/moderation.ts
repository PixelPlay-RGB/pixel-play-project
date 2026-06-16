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

// search_channel_users 의 후보 — 닉네임/UUID 정확일치로 찾은 유저.
export interface ChannelUserCandidate {
  userId: string;
  nickname: string;
  photoUrl: string | null;
}

// 권한 화면 목록 맨 위에 고정하는 스트리머 본인(크리에이터) 식별 정보.
export interface ChannelOwnerIdentity {
  id: string;
  nickname: string;
  photoUrl: string | null;
}
