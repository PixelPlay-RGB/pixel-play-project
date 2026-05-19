// 메시지 표시와 목록 계산에 사용하는 순수 유틸리티를 제공합니다.
import type { MessageListItem } from "@/types/message/message";

export function canGroupMessages(current: MessageListItem, adjacent?: MessageListItem): boolean {
  if (!adjacent) return false;
  if (current.message_type !== "text" || adjacent.message_type !== "text") return false;

  return current.user_id === adjacent.user_id;
}

export function insertMessageByCreatedAtDesc(
  items: MessageListItem[],
  nextMessage: MessageListItem,
) {
  if (items.some((item) => item.id === nextMessage.id)) {
    return items;
  }

  const nextCreatedAt = Date.parse(nextMessage.created_at);
  const insertIndex = items.findIndex((item) => Date.parse(item.created_at) < nextCreatedAt);

  if (insertIndex === -1) {
    return [...items, nextMessage];
  }

  return [...items.slice(0, insertIndex), nextMessage, ...items.slice(insertIndex)];
}

export function replaceMessageById(
  items: MessageListItem[],
  targetMessageId: string,
  nextMessage: MessageListItem,
) {
  const withoutTarget = items.filter((item) => item.id !== targetMessageId);

  if (withoutTarget.some((item) => item.id === nextMessage.id)) {
    return withoutTarget;
  }

  return insertMessageByCreatedAtDesc(withoutTarget, nextMessage);
}

export function updateMessageClientStatus(
  items: MessageListItem[],
  targetMessageId: string,
  clientStatus: MessageListItem["clientStatus"],
) {
  return items.map((item) => {
    if (item.id !== targetMessageId) {
      return item;
    }

    return {
      ...item,
      clientStatus,
    };
  });
}

export function removeMessageById(items: MessageListItem[], targetMessageId: string) {
  return items.filter((item) => item.id !== targetMessageId);
}

export function getLatestMessageDistance(viewport: HTMLDivElement): number {
  return Math.max(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop, 0);
}
