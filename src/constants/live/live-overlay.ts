// 라이브 OBS 오버레이의 표시 정책 상수를 정의합니다.
export const LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE = [
  "#d9b04f",
  "#46c6a9",
  "#ff7b73",
  "#8fb7ff",
  "#b78cff",
  "#71d8ff",
  "#f59e0b",
  "#f472b6",
] as const;

export const LIVE_CHAT_OVERLAY_CREATOR_NICKNAME_COLOR = LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE[1];
export const LIVE_OVERLAY_DEFAULT_VIEWER_NAME = "시청자";
export const LIVE_OVERLAY_DEFAULT_CREATOR_NAME = "크리에이터";
export const LIVE_DONATION_ALERT_DEFAULT_VISIBLE_MS = 5000;
export const LIVE_CHAT_OVERLAY_MESSAGE_LIMIT = 60;
export const LIVE_SECURITY_DEFAULT_TOKEN_VERSION = 1;
export const LIVE_STREAM_SERVER_URL = "rtmp://live.pixel-play.studio/live";
