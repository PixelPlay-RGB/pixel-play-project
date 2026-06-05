// 채널 후원 설정 화면의 고정 옵션과 제한값을 정의합니다.

// donation_min_amount CHECK: 1000 ~ 1000000
export const DONATION_MIN_AMOUNT_FLOOR = 1000;
export const DONATION_MIN_AMOUNT_CEILING = 1000000;
export const DONATION_MIN_AMOUNT_STEP = 100;

// alert_volume / tts_volume CHECK: 0 ~ 100
export const DONATION_ALERT_VOLUME_MIN = 0;
export const DONATION_ALERT_VOLUME_MAX = 100;
export const DONATION_ALERT_VOLUME_STEP = 1;

// 알림음 옵션(5종). src는 /public/sounds/donation/ 아래 파일을 가리킵니다.
// gain: 음원마다 체감 음량이 달라(최대 6배 차이), 같은 볼륨에서 비슷하게 들리도록 보정하는 배율입니다.
//       (Web Audio 분석값 기반, 목표 RMS 0.045. 볼륨 100%에서도 피크가 0.7 미만이라 클리핑 없음)
export const DONATION_ALERT_SOUND_OPTIONS = [
  { value: "classic", label: "밝은 차임", src: "/sounds/donation/classic.mp3", gain: 2.1 },
  { value: "coin", label: "코인", src: "/sounds/donation/coin.mp3", gain: 1.5 },
  { value: "bell", label: "벨", src: "/sounds/donation/bell.mp3", gain: 0.75 },
  { value: "arcade", label: "레트로", src: "/sounds/donation/arcade.mp3", gain: 0.78 },
  { value: "fanfare", label: "팝", src: "/sounds/donation/fanfare.mp3", gain: 4.7 },
] as const;

// 알림음마다 원본 길이가 달라, 재생 길이를 이 값(ms)으로 통일합니다(초과분은 페이드아웃 후 정지).
export const DONATION_ALERT_SOUND_MAX_MS = 2300;

export const DONATION_ALERT_SOUND_DEFAULT = "classic";
export const DONATION_ALERT_SOUND_KEYS = DONATION_ALERT_SOUND_OPTIONS.map(
  (option) => option.value,
) as [string, ...string[]];

// TTS 음성 식별자(voiceURI) 최대 길이 (Web Speech API).
export const DONATION_TTS_VOICE_URI_MAX = 256;

// donation_alert_duration_seconds CHECK: 3 ~ 30
export const DONATION_ALERT_DURATION_OPTIONS = [
  { value: 3, label: "3초" },
  { value: 5, label: "5초" },
  { value: 10, label: "10초" },
  { value: 15, label: "15초" },
  { value: 20, label: "20초" },
  { value: 30, label: "30초" },
] as const;

// tts_rate CHECK: 0.50 ~ 2.00 (Web Speech API rate)
// 원격 음성(Google 등)은 배속이 높으면 음이 깨질 수 있지만, 보통/빠름/매우 빠름 선택 폭을 위해 2.0배까지 제공합니다.
export const DONATION_TTS_RATE_OPTIONS = [
  { value: 1.0, label: "보통" },
  { value: 1.5, label: "빠름" },
  { value: 2.0, label: "매우 빠름" },
] as const;

// 테스트 알림에서 사용할 샘플 후원 정보입니다.
export const DONATION_TEST_ALERT_SAMPLE = {
  donorNickname: "픽셀팬",
  amount: 5000,
  message: "방송 항상 잘 보고 있어요! 오늘도 화이팅!",
} as const;

// 정산 수수료율 (데모). 정산 예정액 = 후원 합계 - 수수료.
export const DONATION_SETTLEMENT_FEE_RATE = 0.1;

// 정산 지급 기준일(데모): 전월 후원분을 매월 N일에 지급한다고 가정합니다.
export const SETTLEMENT_PAYOUT_DAY = 10;

// 정산 내역 조회: 페이지당 건수.
export const SETTLEMENT_PAGE_SIZE = 10;

// 정산 상세 내역 상태 필터 옵션.
export const SETTLEMENT_STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "completed", label: "정산 완료" },
  { value: "scheduled", label: "정산 예정" },
] as const;

// 정산 상세 내역 정렬 옵션.
export const SETTLEMENT_SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "amount", label: "금액순" },
] as const;

export type SettlementStatusFilter = (typeof SETTLEMENT_STATUS_OPTIONS)[number]["value"];
export type SettlementSortOption = (typeof SETTLEMENT_SORT_OPTIONS)[number]["value"];
