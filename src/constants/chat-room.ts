import type { ChatRoomTab } from "@/types/chat-room";

export const CHAT_ROOM_MIN_CAPACITY = 2;
export const CHAT_ROOM_MAX_CAPACITY = 50;

export const CHAT_ROOM_TABS: ChatRoomTab[] = ["JOINED", "NOT_JOINED", "OWNED"];

export const ROOM_TAB_LABELS: Record<ChatRoomTab, string> = {
  JOINED: "참여중인 채팅방",
  NOT_JOINED: "참여 가능한 채팅방",
  OWNED: "내가 만든 채팅방",
};

export const CHAT_ROOM_EMPTY_MESSAGES: Record<ChatRoomTab, string> = {
  JOINED: "아직 참여한 채팅방이 없어요.",
  NOT_JOINED: "참여 가능한 채팅방이 없어요.",
  OWNED: "아직 만든 채팅방이 없어요.",
};
