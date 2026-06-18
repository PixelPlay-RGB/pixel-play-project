// 방송 운영(스튜디오) 화면에서 사용하는 라이브 상태 도메인 타입을 정의합니다.

export type ChannelLiveVisibility = "public" | "private" | "unlisted";
export type ChannelLiveChatScope = "authenticated" | "follower" | "manager";

export interface ChannelLiveState {
  isBroadcasting: boolean;
  hasEnded: boolean;
  visibility: ChannelLiveVisibility;
}
