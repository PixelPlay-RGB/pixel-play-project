// 로그인 상태에서 message INSERT를 구독해 방 목록 안읽음 배지가 갱신되도록 합니다.
"use client";

import { useChatRoomsUnreadRealtime } from "@/hooks/use-chat-rooms-unread-realtime";

export default function ChatRoomsUnreadRealtimeListener() {
  useChatRoomsUnreadRealtime();
  return null;
}
