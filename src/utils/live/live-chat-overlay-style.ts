// OBS 채팅 오버레이의 표시 색상을 계산합니다.
import {
  LIVE_CHAT_OVERLAY_CREATOR_NICKNAME_COLOR,
  LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE,
} from "@/constants/live/live-overlay";
import { hashStringToIndex } from "@/utils/common/hash";

export function getLiveChatOverlayNicknameColor(author: string, role?: "creator" | "donor") {
  if (role === "creator") {
    return LIVE_CHAT_OVERLAY_CREATOR_NICKNAME_COLOR;
  }

  // 닉네임을 31배 자리가중 해시로 팔레트 전체에 고르게 분산시킨다(공용 hashStringToIndex).
  return LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE[
    hashStringToIndex(author, LIVE_CHAT_OVERLAY_NICKNAME_COLOR_PALETTE.length)
  ];
}
