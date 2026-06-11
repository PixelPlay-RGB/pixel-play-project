// 라이브 룰렛 결과를 DB 저장 없이 Realtime broadcast로 주고받을 때 쓰는 채널 상수입니다.
export const LIVE_ROULETTE_BROADCAST_EVENT = "roulette_notice";

export function getLiveRouletteBroadcastTopic(broadcastId: string) {
  return `live-roulette-${broadcastId}`;
}
