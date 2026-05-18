"use client";
// 채팅방 Presence 상태를 하위 채팅 컴포넌트에 제공하는 Provider

import { createContext, type ReactNode, useContext, useMemo } from "react";

import { useChatRoomPresence } from "@/hooks/chat-room/use-chat-room-presence";
import type { ChatRoomMemberPresenceMap, ChatRoomPresenceStatus } from "@/types/chat-room-presence";
import type { DBUser } from "@/types/user";

interface ChatRoomPresenceContextValue {
  memberPresence: ChatRoomMemberPresenceMap;
  getMemberPresenceStatus: (userId: string) => ChatRoomPresenceStatus | null;
  setTyping: (isTyping: boolean) => void;
}

interface Props {
  roomId: string;
  currentUser: Pick<DBUser, "id" | "nickname" | "photo_url"> | null;
  enabled: boolean;
  children: ReactNode;
}

const ChatRoomPresenceContext = createContext<ChatRoomPresenceContextValue | null>(null);

export function ChatRoomPresenceProvider({ roomId, currentUser, enabled, children }: Props) {
  const { memberPresence, setTyping } = useChatRoomPresence({
    roomId,
    currentUser,
    enabled,
  });

  const value = useMemo<ChatRoomPresenceContextValue>(
    () => ({
      memberPresence,
      getMemberPresenceStatus: (userId) => memberPresence[userId] ?? null,
      setTyping,
    }),
    [memberPresence, setTyping],
  );

  return (
    <ChatRoomPresenceContext.Provider value={value}>{children}</ChatRoomPresenceContext.Provider>
  );
}

export function useChatRoomPresenceContext(): ChatRoomPresenceContextValue {
  const context = useContext(ChatRoomPresenceContext);

  if (!context) {
    throw new Error("ChatRoomPresenceProvider 내부에서만 Presence 상태를 사용할 수 있습니다.");
  }

  return context;
}
