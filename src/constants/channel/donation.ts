// 채널 후원 설정 화면의 고정 옵션과 제한값을 정의합니다.

// donation_min_amount CHECK: 1000 ~ 1000000
export const DONATION_MIN_AMOUNT_FLOOR = 1000;
export const DONATION_MIN_AMOUNT_CEILING = 1000000;
export const DONATION_MIN_AMOUNT_STEP = 100;

// alert_volume CHECK: 0 ~ 100
export const DONATION_ALERT_VOLUME_MIN = 0;
export const DONATION_ALERT_VOLUME_MAX = 100;
export const DONATION_ALERT_VOLUME_STEP = 5;

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
