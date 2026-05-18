// 메시지 표시와 목록 계산에 사용하는 순수 유틸리티를 제공합니다.
import type { MessageQuery } from "@/types/message";

export function canGroupMessages(current: MessageQuery, adjacent?: MessageQuery): boolean {
  if (!adjacent) return false;
  if (current.message_type !== "text" || adjacent.message_type !== "text") return false;

  return current.user_id === adjacent.user_id;
}

export function getLatestMessageDistance(viewport: HTMLDivElement): number {
  return Math.max(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop, 0);
}
