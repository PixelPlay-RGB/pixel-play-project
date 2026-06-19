// 메시지 버퍼 관리와 시청자 수·후원 금액·경과 시간 포맷 유틸을 제공합니다.

import { CLEANBOT_PROFANITY_WORDS } from "@/constants/live/cleanbot";
import { LIVE_MESSAGE_HISTORY_CAP } from "@/constants/live/live";
import type { LiveChatMessage } from "@/types/live/live";
import { formatNumber } from "@/utils/common/format";

// 클린봇 1차(클라이언트 즉시) 가림 — 서버 LLM 판정 도착 전, 명백한 욕설을 0초에 가린다(#120).
// 한글(완성형·자모)과 영문 글자만 남기고 공백·숫자·특수문자(@ . - * ~ 등)·이모지를 모두 제거한
// 뒤 부분일치한다. "ㅅ ㅂ", "시@발", "병.신", "시1발" 같은 끼워넣기 우회를 한 번에 잡는다.
// 서버 판정이 도착하면(mapLiveMessageRowToMessage) 그 결과를 신뢰하므로 사전 오탐은 LLM이 해제한다.
export function containsSeedProfanity(content: string): boolean {
  if (!content) return false;
  const normalized = content.toLowerCase().replace(/[^a-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, "");
  return CLEANBOT_PROFANITY_WORDS.some((word) => normalized.includes(word));
}

// 크리에이터 지정 금칙어(forbidden_words) 선검사 — 서버 send_live_message_v4와 동일하게
// 각 금칙어를 trim+소문자화해 메시지(소문자)에 부분 포함되는지 본다(정규화 없는 단순 부분일치).
// 전송 직전 client가 막아 원문 optimistic 깜빡임을 없앤다(서버 검사는 방어선으로 유지).
export function matchesForbiddenWord(content: string, forbiddenWords: readonly string[]): boolean {
  if (forbiddenWords.length === 0) return false;
  const normalized = content.toLowerCase();
  return forbiddenWords.some((word) => {
    const trimmed = word.trim().toLowerCase();
    return trimmed !== "" && normalized.includes(trimmed);
  });
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
