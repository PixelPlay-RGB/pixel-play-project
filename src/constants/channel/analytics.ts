// 채널 실시간 통계 화면에서 사용하는 라벨·집계 윈도우·샘플 버퍼 상수를 정의합니다.

export const ANALYTICS_LABEL = {
  kicker: "실시간 방송 통계",
  title: "방송 흐름을 실시간으로 살펴봐요",
  description:
    "방송이 진행되는 동안 시청자·채팅·후원 지표가 실시간으로 갱신돼요. 새로고침하면 추이 기록은 처음부터 다시 시작해요.",
  currentViewers: "현재 시청자",
  peakViewersPrefix: "최고",
  messagesPerMinute: "분당 메시지",
  messagesPerMinuteWindow: "최근 1분",
  cumulativeDonation: "누적 후원",
  followGrowth: "팔로우 증가",
  recentWindow: "최근 30분",
  viewerSeries: "시청자",
  viewerTrendTitle: "시청자 추이",
  viewerTrendDescription: "방송 시작 이후 시청자 수 변화예요.",
  interactionLogTitle: "상호작용 로그",
  interactionLogDescription: "방송 중 발생한 후원·팔로우를 최신순으로 보여줘요.",
  interactionEmpty: "아직 기록된 상호작용이 없어요.",
  logDonation: "후원",
  logFollow: "팔로우",
  offlineTitle: "방송이 진행 중이 아니에요",
  offlineDescription: "방송을 시작하면 실시간 통계가 여기에 표시돼요.",
  placeholder: "—",
  connectionConnected: "실시간 연결됨",
  connectionConnecting: "실시간 연결 중",
  connectionReconnecting: "재연결 중",
  viewersPending: "동접 집계 준비중",
  followError: "팔로우 지표를 잠시 불러오지 못했어요",
  rangeRecent5m: "최근 5분",
  rangeRecent30m: "최근 30분",
  rangeAll: "전체",
  // TODO(#88): 채팅 제한 이벤트는 제한 기록을 저장하는 테이블이 생기면 로그에 추가한다.
} as const;

export const ANALYTICS_UNIT = {
  viewers: "명",
  messagesPerMinute: "개/분",
  donationCount: "건",
  point: "P",
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

// 팔로우 증가 폴링 설정(viewer_creator_relation은 Realtime 발행 대상이 아님)
export const ANALYTICS_FOLLOW_WINDOW_MS = 1_800_000; // 최근 30분
export const ANALYTICS_FOLLOW_POLL_MS = 30_000; // 폴링 주기(30초)
export const ANALYTICS_FOLLOW_LOG_LIMIT = 100; // 로그에 노출할 팔로우 이벤트 최대 개수
export const ANALYTICS_DONATION_LOG_LIMIT = 100; // 로그에 누적할 후원 이벤트 최대 개수(무한 증가 방지)
