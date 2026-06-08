// 채널 실시간 통계 화면에서 사용하는 라벨·집계 윈도우·샘플 버퍼 상수를 정의합니다.

export const ANALYTICS_LABEL = {
  kicker: "실시간 방송 통계",
  title: "방송 흐름을 실시간으로 살펴봐요",
  description:
    "방송이 진행되는 동안 시청자·채팅·후원 지표가 실시간으로 갱신돼요. 새로고침하면 추이 기록은 처음부터 다시 시작해요.",
  currentViewers: "현재 시청자",
  peakViewersPrefix: "최고",
  peakRatioPrefix: "최고 대비",
  peakRatioAtPeak: "현재 최고치",
  averageViewers: "평균 동시 시청자",
  averageViewersHint: "방송 시작 이후 평균",
  elapsedPrefix: "방송 경과",
  elapsedPending: "방송 경과 —",
  messagesPerMinute: "분당 메시지",
  chatParticipants: "채팅 참여",
  chatParticipantsValueSuffix: "명",
  chatParticipantsRatePrefix: "참여율",
  cumulativeDonation: "누적 후원",
  donationAveragePrefix: "건당 평균",
  donationPacePrefix: "최근",
  followGrowth: "팔로우 증가",
  recentWindow: "최근 30분",
  topSupporterTitle: "이번 방송 top 후원자",
  topSupporterEmpty: "아직 후원이 없어요.",
  topSupporterAmountSuffix: "후원",
  viewerTrendTitle: "시청자 추이",
  viewerTrendDescription: "현재 시청자(실시간 접속) 수와 평균 동시 시청자 기준선이에요.",
  interactionLogTitle: "상호작용 로그",
  interactionLogDescription: "방송 중 발생한 후원·팔로우를 최신순으로 보여줘요.",
  interactionEmpty: "아직 기록된 상호작용이 없어요.",
  logDonation: "후원",
  logFollow: "팔로우",
  logFollowSuffix: "님 팔로우",
  offlineTitle: "방송이 진행 중이 아니에요",
  offlineDescription: "방송을 시작하면 실시간 통계가 여기에 표시돼요.",
  placeholder: "—",
  connectionConnected: "실시간 연결됨",
  connectionConnecting: "실시간 연결 중",
  connectionReconnecting: "재연결 중",
  followError: "팔로우 지표를 잠시 불러오지 못했어요",
  rangeRecent5m: "최근 5분",
  rangeRecent30m: "최근 30분",
  rangeAll: "처음부터",
  logUnfollow: "팔로우 취소",
  logUnfollowSuffix: "님 팔로우 취소",
  reportKicker: "방송 결과 지표",
  reportTitle: "지난 방송을 돌아봐요",
  reportDescription:
    "종료된 방송의 방송 시간·채팅·후원 요약이에요. 시간대별 추이 그래프는 실시간 통계에서만 볼 수 있어요.",
  reportColBroadcast: "방송",
  reportDuration: "방송 시간",
  reportParticipant: "채팅 참여자",
  reportParticipantSuffix: "명",
  reportDonation: "후원",
  reportDonationCountSuffix: "건",
  reportStartSuffix: "시작",
  reportEmptyTitle: "아직 종료된 방송이 없어요",
  reportEmptyDescription: "방송을 한 번 마치면 결과 지표가 여기에 쌓여요.",
  reportPeriodEmpty: "이 기간에는 종료된 방송이 없어요. 기간을 넓혀보세요.",
  // 상단 누적 합계 카드
  reportSummaryBroadcasts: "진행한 라이브",
  reportSummaryDuration: "총 라이브 시간",
  reportSummaryPeak: "최고 동시 시청자",
  reportSummaryChat: "채팅 참여자",
  reportSummaryDonation: "총 후원",
  reportPeakSuffix: "명",
  // 기간 프리셋 선택기
  reportPeriod7d: "최근 7일",
  reportPeriod30d: "최근 30일",
  reportPeriodAll: "전체",
  // TODO(#88): 채팅 제한 이벤트는 제한 기록을 저장하는 테이블이 생기면 로그에 추가한다.
} as const;

export const ANALYTICS_UNIT = {
  viewers: "명",
  messagesPerMinute: "개/분",
  donationCount: "건",
  broadcast: "개",
  point: "P",
  pointPerMinute: "P/분",
} as const;

// 시청자 추이·분당 메시지 파생을 위한 클라이언트 샘플 버퍼 설정
export const ANALYTICS_SAMPLE_CAP = 240; // 누적 샘플 최대 개수(초과 시 오래된 것부터 제거)
export const ANALYTICS_SAMPLE_INTERVAL_MS = 5_000; // 시계열 적재 고정 주기(채팅 트래픽과 분리)
export const ANALYTICS_MPM_WINDOW_MS = 60_000; // 분당 메시지 계산 윈도우(1분)
export const ANALYTICS_TREND_WINDOW_MS = 600_000; // 추세 비교 기준 시점(10분 전)
export const ANALYTICS_TREND_CLAMP = 999; // 추세(%) 표시 상·하한(비정상 스파이크 방지)

// 시청자 추이 차트 시간 범위 옵션
export const ANALYTICS_RANGE_OPTIONS = [
  { value: "5m", labelKey: "rangeRecent5m", ms: 300_000 },
  { value: "30m", labelKey: "rangeRecent30m", ms: 1_800_000 },
  { value: "all", labelKey: "rangeAll", ms: null },
] as const;

// 고유 채팅 참여자 집계 설정(live_message INSERT 구독, 롤링 윈도우 distinct sender_id)
export const ANALYTICS_PARTICIPANT_WINDOW_MS = 300_000; // 최근 5분 안에 채팅한 사람을 활성 참여자로 본다
export const ANALYTICS_PARTICIPANT_PRUNE_MS = 15_000; // 새 메시지가 없어도 만료분을 걷어내고 카운트를 갱신하는 주기

// 후원 페이스(최근 금액 속도) 계산 윈도우
export const ANALYTICS_DONATION_PACE_WINDOW_MS = 600_000; // 최근 10분 후원 금액을 분당으로 환산

export const ANALYTICS_DONATION_LOG_LIMIT = 100; // 로그에 누적할 후원 이벤트 최대 개수(무한 증가 방지)

// 지난 방송 분석에 노출할 종료된 방송 최대 개수
export const ANALYTICS_REPORT_LIMIT = 30;

// 지난 방송 분석 목록 페이지당 방송 개수(전체 fetch 후 메모리 페이징)
export const REPORT_PAGE_SIZE = 10;

// 지난 방송 분석 기간 프리셋(상단 합계·하단 목록 공통 조회 범위)
export const REPORT_PERIOD_DEFAULT = "all" as const;
export const REPORT_PERIOD_OPTIONS = [
  { value: "7d", labelKey: "reportPeriod7d", days: 7 },
  { value: "30d", labelKey: "reportPeriod30d", days: 30 },
  { value: "all", labelKey: "reportPeriodAll", days: null },
] as const;

// 상호작용 로그 팔로우/언팔로우 이벤트 설정(creator_follow_event 구독)
export const ANALYTICS_FOLLOW_EVENT_WINDOW_MS = 1_800_000; // 로그·KPI가 유지하는 롤링 윈도우(최근 30분)
export const ANALYTICS_FOLLOW_EVENT_LOG_LIMIT = 100; // 로그에 누적할 팔로우 이벤트 최대 개수
export const ANALYTICS_FOLLOW_EVENT_REFETCH_MS = 60_000; // 윈도우 갱신·놓친 이벤트 보정 주기(60초)
