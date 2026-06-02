// 라이브 채팅 메시지 필터링과 시청자 수·후원 금액·경과 시간 포맷 유틸을 제공합니다.

import type { LiveChatMessage } from "@/types/live/live";

export function filterChatMessages(messages: LiveChatMessage[]): LiveChatMessage[] {
  return messages.filter((msg) => msg.type !== "filtered");
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
