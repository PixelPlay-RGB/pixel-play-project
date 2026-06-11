// 라이브 OBS 오버레이의 표시 정책 상수를 정의합니다.
import type { LiveChatOverlayItem } from "@/types/live/live-chat-overlay";

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

// 채팅 오버레이 미리보기(?preview=1)에서 실데이터가 없을 때 화면 구성을 보여주는 샘플.
// createdAt은 hydration 불일치가 없도록 고정 문자열을 쓴다(화면 표시에는 사용되지 않음).
export const LIVE_CHAT_OVERLAY_PREVIEW_ITEMS: LiveChatOverlayItem[] = [
  {
    type: "message",
    message: {
      id: "preview-chat-1",
      kind: "chat",
      author: "픽셀시청자",
      content: "오늘 방송 너무 재밌어요!",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  },
  {
    type: "message",
    message: {
      id: "preview-chat-2",
      kind: "chat",
      author: "크리에이터",
      content: "와주셔서 감사합니다 🙌",
      createdAt: "2026-01-01T00:00:01.000Z",
      role: "creator",
    },
  },
  {
    type: "message",
    message: {
      id: "preview-chat-3",
      kind: "chat",
      author: "픽셀팬",
      content: "오늘도 화이팅!",
      createdAt: "2026-01-01T00:00:02.000Z",
      role: "donor",
    },
  },
  {
    type: "message",
    message: {
      id: "preview-donation-1",
      kind: "donation",
      author: "픽셀팬",
      content: "방송 항상 잘 보고 있어요! 오늘도 화이팅!",
      createdAt: "2026-01-01T00:00:03.000Z",
      amount: 5000,
    },
  },
];
