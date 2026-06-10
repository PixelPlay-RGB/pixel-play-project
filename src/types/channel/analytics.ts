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

// 상호작용 로그 이벤트(후원·팔로우·언팔로우 공통).
export type AnalyticsLogEventType = "donation" | "follow" | "unfollow";

export interface AnalyticsLogEvent {
  id: string;
  type: AnalyticsLogEventType;
  at: string; // ISO 타임스탬프
  amount?: number; // 후원 이벤트에만 존재
  actorName?: string; // 행위자 표시 닉네임(후원자·팔로워). 익명 후원은 alias, 식별자(donor_id 등)는 노출 안 함.
}

// 이번 방송 최다 후원자(actorName 단위 금액 합산 결과).
export interface TopSupporter {
  name: string;
  amount: number;
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
  currentViewers: number; // live_broadcast.current_viewer_count(시청 화면과 동일 소스)
  peakViewers: number;
  averageViewers: number; // 방송 시작 이후 동접 평균(샘플 평균)
  peakRatio: number | null; // 현재 동접의 최고 대비 % (0~−100, 데이터 부족 시 null)
  chatMessageCount: number;
  donationCount: number;
  donationAmountTotal: number;
  messagesPerMinute: number | null; // 샘플 부족 시 null
  viewerTrend: number | null; // 10분 전 대비 시청자 % 변화
  donationTrend: number | null; // 10분 전 대비 누적 후원 % 변화
  donationPacePerMinute: number | null; // 최근 윈도우 후원 금액의 분당 환산(P/분), 부족 시 null
  samples: AnalyticsSample[];
  connection: AnalyticsConnectionState;
}

// 고유 채팅 참여자 집계 결과(live_message 구독 기반 롤링 윈도우 distinct).
export interface CreatorChatParticipants {
  uniqueCount: number; // 최근 윈도우 내 채팅한 고유 사용자 수(0도 유효 — 조용한 방송)
  connection: AnalyticsConnectionState;
}

// 팔로우/언팔로우 피드 결과(creator_follow_event 초기 쿼리 + Realtime).
export interface FollowFeed {
  count: number; // 윈도우 내 순증(신규 팔로우 − 언팔로우), 취소가 많으면 음수
  events: AnalyticsLogEvent[];
  isError: boolean;
  connection: AnalyticsConnectionState;
}

// 지난 방송 분석: 종료된 방송 한 건의 최종 요약 지표(live_broadcast 종료 후에도 남는 집계).
export interface BroadcastReport {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  startedAt: string;
  durationMs: number;
  // 최고 동접 writer(#72 시청 화면 하트비트)가 dev에 합류하기 전에는 0으로 남는다.
  // 0이면 화면에서 "—"로 도배되지 않게 graceful 처리한다.
  peakViewerCount: number;
  // 채팅 고유 참여자 수(live_message의 distinct sender_id). 총 메시지 수가 아니라 "몇 명이 참여했나".
  chatParticipantCount: number;
  donationCount: number;
  donationAmountTotal: number;
}

// 지난 방송 분석 상단 헤더: 선택 기간 내 종료 방송들의 누적 합계.
export interface BroadcastReportSummary {
  broadcastCount: number;
  totalDurationMs: number;
  peakViewerCount: number; // 기간 내 최고 동접(각 방송 peak의 최댓값). 0이면 미집계로 본다.
  chatParticipantCount: number; // 기간 내 채팅 고유 참여자(방송 간 합집합, 연인원 아님).
  totalDonationCount: number;
  totalDonationAmount: number;
}

// 페이지 → 뷰로 넘기는 페이로드. 참여자 합집합은 방송별 카운트로 못 구해서 별도로 싣는다.
export interface BroadcastReportPayload {
  reports: BroadcastReport[];
  totalChatParticipants: number;
}

// 지난 방송 분석 기간 프리셋(서버 조회 범위).
export type BroadcastReportPeriod = "7d" | "30d" | "all";
