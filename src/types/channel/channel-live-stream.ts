// 방송 송출 서버에서 조회한 실제 스트림 상태 타입을 정의합니다.

export type ChannelLiveStreamStatusState = "online" | "offline" | "unavailable";

export interface ChannelLiveStreamStatusResponse {
  autoThumbnailUrl?: string | null;
  checkedAt: string;
  errorMessage?: string;
  fps: number | null;
  height: number | null;
  inboundBytes: number | null;
  onlineTime: string | null;
  state: ChannelLiveStreamStatusState;
  streamPath: string;
  width: number | null;
}
