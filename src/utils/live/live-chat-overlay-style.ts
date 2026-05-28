// OBS 채팅 오버레이의 표시 색상을 계산합니다.
import { LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE } from "@/constants/live/live-overlay";
import type { LiveChatOverlayMessage } from "@/types/live/live-chat-overlay";

export function getLiveChatOverlayNicknameColor(
  author: string,
  role?: LiveChatOverlayMessage["role"],
) {
  if (role === "creator") {
    return "#46c6a9";
  }

  const hash = Array.from(author).reduce((acc, character) => acc + character.charCodeAt(0), 0);

  return LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE[
    hash % LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE.length
  ];
}
