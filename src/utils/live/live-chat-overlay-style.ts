// OBS 채팅 오버레이의 표시 색상을 계산합니다.
import {
  LIVE_CHAT_OVERLAY_CREATOR_NICKNAME_COLOR,
  LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE,
} from "@/constants/live/live-overlay";
import type { LiveChatOverlayMessage } from "@/types/live/live-chat-overlay";

export function getLiveChatOverlayNicknameColor(
  author: string,
  role?: LiveChatOverlayMessage["role"],
) {
  if (role === "creator") {
    return LIVE_CHAT_OVERLAY_CREATOR_NICKNAME_COLOR;
  }

  // 단순 합산 해시는 글자 순서가 달라도 같은 값이 되어("가나"="나가") 색이 몰린다 —
  // 자리 가중(31배) 누적으로 닉네임이 팔레트 전체에 고르게 분산되게 한다.
  const hash = Array.from(author).reduce(
    (acc, character) => (acc * 31 + character.charCodeAt(0)) | 0,
    0,
  );

  return LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE[
    Math.abs(hash) % LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE.length
  ];
}
