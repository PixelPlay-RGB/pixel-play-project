// 클린봇 비속어 판정·메시지 버퍼 관리와 시청자 수·후원 금액·경과 시간 포맷 유틸을 제공합니다.

import { CLEANBOT_PROFANITY_WORDS } from "@/constants/live/cleanbot";
import { LIVE_MESSAGE_LIMIT } from "@/constants/live/live";
import type { LiveChatMessage } from "@/types/live/live";

// 메시지 본문이 클린봇 시드 사전의 비속어를 포함하는지(대소문자 무시 부분일치) 판정한다.
// 방장 금칙어(서버 차단)와 별개의 best-effort 필터다.
export function isCleanbotFlagged(content: string): boolean {
  if (!content) return false;
  const normalized = content.toLowerCase();
  return CLEANBOT_PROFANITY_WORDS.some((word) => normalized.includes(word));
}

// 메시지 리스트에 새 메시지를 추가하고 최대 보관 건수(LIVE_MESSAGE_LIMIT)로 자른다.
export function appendLiveMessage(
  list: LiveChatMessage[],
  message: LiveChatMessage,
): LiveChatMessage[] {
  return [...list, message].slice(-LIVE_MESSAGE_LIMIT);
}

export function formatCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }
  return count.toLocaleString();
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
  return amount.toLocaleString();
}
