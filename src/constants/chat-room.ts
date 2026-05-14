import type { ChatRoomSortOption, ChatRoomTab } from "@/types/chat-room";

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

export const DEFAULT_CHAT_ROOM_SORT_OPTION: ChatRoomSortOption = "CREATED_AT_DESC";

export const CHAT_ROOM_SORT_LABELS: Record<ChatRoomSortOption, string> = {
  CREATED_AT_DESC: "생성일 최신순",
  LAST_MESSAGE_DESC: "최신 메시지순",
  CURRENT_MEMBER_DESC: "참여자 많은순",
};

export const CHAT_ROOM_SORT_OPTIONS_BY_TAB: Record<ChatRoomTab, ChatRoomSortOption[]> = {
  JOINED: ["CREATED_AT_DESC", "LAST_MESSAGE_DESC", "CURRENT_MEMBER_DESC"],
  NOT_JOINED: ["CREATED_AT_DESC", "CURRENT_MEMBER_DESC"],
  OWNED: ["CREATED_AT_DESC", "LAST_MESSAGE_DESC", "CURRENT_MEMBER_DESC"],
};
