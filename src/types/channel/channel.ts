// 공개 채널 페이지(치지직형)의 크리에이터 프로필 헤더 타입을 정의합니다.

export interface ChannelProfile {
  id: string;
  nickname: string;
  photoUrl: string | null;
  followerCount: number;
  isFollowing: boolean;
  // 시청자가 곧 채널 주인인지 여부(팔로우 버튼 → "내 채널").
  isOwnChannel: boolean;
}
