// 채널 실시간 통계 화면에서 사용하는 타입을 정의합니다.

// get_creator_studio_snapshot.activeBroadcast 중 통계에 필요한 필드만 추린 형태.
export interface AnalyticsBroadcast {
  id: string;
  title: string;
  startedAt: string;
  currentViewerCount: number;
  peakViewerCount: number;
  chatMessageCount: number;
  donationCount: number;
  donationAmountTotal: number;
}

// 상호작용 로그 이벤트(후원·팔로우 공통).
export type AnalyticsLogEventType = "donation" | "follow";

export interface AnalyticsLogEvent {
  id: string;
  type: AnalyticsLogEventType;
  at: string; // ISO 타임스탬프
  amount?: number; // 후원 이벤트에만 존재
}

// SSR 초기 스냅샷.
export interface ChannelAnalyticsSnapshot {
  creatorId: string;
  broadcast: AnalyticsBroadcast | null; // null이면 방송 오프라인
  recentDonations: AnalyticsLogEvent[];
}

// 시청자 추이·분당 메시지 파생용 클라이언트 누적 샘플.
export interface AnalyticsSample {
  at: number; // epoch ms
  viewers: number;
  chatCount: number;
  donationAmountTotal: number; // 누적 후원(추세 파생용)
}

// Realtime 구독 연결 상태(연결 상태 표시·재연결 판단).
export type AnalyticsConnectionState = "connecting" | "connected" | "reconnecting";

// 시청자 추이 차트 시간 범위.
export type AnalyticsRange = "5m" | "30m" | "all";

// live_broadcast Realtime로 갱신되는 실시간 집계 + 파생 지표.
export interface CreatorLiveStats {
  peakViewers: number;
  chatMessageCount: number;
  donationCount: number;
  donationAmountTotal: number;
  messagesPerMinute: number | null; // 샘플 부족 시 null
  messagesPerMinuteTrend: number | null; // 10분 전 대비 % 변화, 부족 시 null
  viewerTrend: number | null; // 10분 전 대비 시청자 % 변화
  donationTrend: number | null; // 10분 전 대비 누적 후원 % 변화
  samples: AnalyticsSample[];
  connection: AnalyticsConnectionState;
}

// presence 기반 동접 집계 결과.
export interface CreatorLivePresence {
  viewers: number;
  isAggregating: boolean; // false면 presence 미연동(시청 화면 미머지)으로 폴백값 사용 중
  connection: AnalyticsConnectionState;
}

// 팔로우 증가 폴링 결과.
export interface FollowGrowth {
  count: number;
  events: AnalyticsLogEvent[];
}
