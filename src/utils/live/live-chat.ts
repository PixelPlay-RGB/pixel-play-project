// 메시지 버퍼 관리와 시청자 수·후원 금액·경과 시간 포맷 유틸을 제공합니다.

import { CLEANBOT_PROFANITY_WORDS } from "@/constants/live/cleanbot";
import { LIVE_MESSAGE_HISTORY_CAP } from "@/constants/live/live";
import type { LiveChatMessage } from "@/types/live/live";
import { formatNumber } from "@/utils/common/format";

// 클린봇 1차(클라이언트 즉시) 가림 — 서버 LLM 판정 도착 전, 명백한 욕설을 0초에 가린다(#120).
// 소문자화 + 공백 제거 후 부분일치라 "ㅅ ㅂ" 같은 띄어쓰기 우회도 잡는다. 서버 판정이 도착하면
// (mapLiveMessageRowToMessage) 그 결과를 신뢰하므로, 사전 오탐은 LLM이 clean으로 자동 해제한다.
export function containsSeedProfanity(content: string): boolean {
  if (!content) return false;
  const normalized = content.toLowerCase().replace(/\s+/g, "");
  return CLEANBOT_PROFANITY_WORDS.some((word) => normalized.includes(word));
}

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
