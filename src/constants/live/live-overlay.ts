// 라이브 OBS 오버레이의 표시 정책 상수를 정의합니다.
import type { LiveChatOverlayItem } from "@/types/live/live-chat-overlay";

// 닉네임 식별용 팔레트 — 어두운 채팅 배경 기준 가독 밝기 대역에서 색상환을 고르게 커버한다.
// 앞 8색은 기존 색 유지(크리에이터 색 = index 1 고정), 뒤 8색은 색상환 빈 구간을 채운 확장분.
// 이 hex들은 <canvas>(OBS 오버레이)에 직접 그리는 의도된 하드코딩 — CSS 변수는 캔버스 컨텍스트에서
// 해석되지 않으므로 토큰화 불가. 색 변경 금지(시각 식별 팔레트 고정).
export const LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE = [
  "#d9b04f",
  "#46c6a9",
  "#ff7b73",
  "#8fb7ff",
  "#b78cff",
  "#71d8ff",
  "#f59e0b",
  "#f472b6",
  "#f87171",
  "#fb923c",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#06b6d4",
  "#818cf8",
  "#e879f9",
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
      roles: ["creator"],
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
      roles: ["donor"],
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
