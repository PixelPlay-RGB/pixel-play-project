// 메시지 infinite query 캐시 갱신에 사용하는 순수 helper를 제공합니다.
import type { InfiniteData } from "@tanstack/react-query";

import type { MessageListItem, MessagesPage } from "@/types/message";

export function createOptimisticMessage({
  id,
  roomId,
  userId,
  content,
  nickname,
  photoUrl,
}: {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  nickname: string;
  photoUrl: string | null;
}): MessageListItem {
  const now = new Date().toISOString();

  return {
    id,
    chat_room_id: roomId,
    user_id: userId,
    content,
    message_type: "text",
    created_at: now,
    modified_at: now,
    clientStatus: "sending",
    user: {
      nickname,
      photo_url: photoUrl,
    },
  };
}

export function updateFirstMessagesPage(
  previous: InfiniteData<MessagesPage> | undefined,
  updater: (items: MessageListItem[]) => MessageListItem[],
) {
  if (!previous) return previous;

  const [firstPage, ...restPages] = previous.pages;
  if (!firstPage) return previous;

  return {
    ...previous,
    pages: [
      {
        ...firstPage,
        items: updater(firstPage.items),
      },
      ...restPages,
    ],
  };
}
