// 메시지 버퍼 관리와 시청자 수·후원 금액·경과 시간 포맷 유틸을 제공합니다.

import { LIVE_MESSAGE_HISTORY_CAP } from "@/constants/live/live";
import type { LiveChatMessage } from "@/types/live/live";
import { formatNumber } from "@/utils/common/format";

// 메시지 리스트에 새 메시지를 추가하고 최대 보관 건수(LIVE_MESSAGE_HISTORY_CAP)로 자른다.
// 위로 적재한 과거 채팅도 새 메시지가 쌓이면 캡에 밀려 자연스럽게 정리된다.
export function appendLiveMessage(
  list: LiveChatMessage[],
  message: LiveChatMessage,
): LiveChatMessage[] {
  return [...list, message].slice(-LIVE_MESSAGE_HISTORY_CAP);
}

export function formatCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }
  return formatNumber(count);
}

export function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function formatDonationAmount(amount: number): string {
  return formatNumber(amount);
}
