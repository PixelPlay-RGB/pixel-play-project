// 채팅방 목록 RPC 응답을 화면 모델로 정규화합니다.

import {
  CHAT_ROOM_SORT_OPTIONS_BY_TAB,
  DEFAULT_CHAT_ROOM_SORT_OPTION_BY_TAB,
} from "@/constants/chat-room/chat-room";
import type {
  ChatRoomCounts,
  ChatRoomListItem,
  ChatRoomSortOption,
  ChatRoomTab,
} from "@/types/chat-room/chat-room";
import type { Json } from "@/types/database.types";

type JsonRecord = { [key: string]: Json | undefined };

export const EMPTY_CHAT_ROOM_COUNTS: ChatRoomCounts = {
  JOINED: 0,
  NOT_JOINED: 0,
  OWNED: 0,
};

export const EMPTY_CHAT_ROOM_LIST = {
  rooms: [] as ChatRoomListItem[],
  counts: EMPTY_CHAT_ROOM_COUNTS,
  totalItems: 0,
  totalPages: 0,
};

function isJsonRecord(value: Json): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRoom(value: Json): ChatRoomListItem | null {
  if (!isJsonRecord(value)) {
    return null;
  }

  const {
    id,
    title,
    description,
    max_capacity,
    current_member,
    owner_id,
    owner_nickname,
    created_at,
    unread_count,
  } = value;

  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    (description !== null && typeof description !== "string") ||
    typeof max_capacity !== "number" ||
    typeof current_member !== "number" ||
    typeof owner_id !== "string" ||
    typeof owner_nickname !== "string" ||
    typeof created_at !== "string" ||
    typeof unread_count !== "number"
  ) {
    return null;
  }

  return {
    id,
    title,
    description,
    max_capacity,
    current_member,
    owner_id,
    owner_nickname,
    created_at,
    unread_count,
  };
}

export function parseChatRoomListItems(value: Json): ChatRoomListItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((room) => {
    const parsedRoom = parseRoom(room);
    return parsedRoom ? [parsedRoom] : [];
  });
}

export function getEffectiveChatRoomCounts(
  counts: ChatRoomCounts,
  tabType: ChatRoomTab,
  totalItems: number,
  searchQuery: string,
): ChatRoomCounts {
  if (searchQuery.trim().length === 0) {
    return counts;
  }

  return {
    ...counts,
    [tabType]: totalItems,
  };
}

export function getValidChatRoomSortOption(
  tabType: ChatRoomTab,
  sortOption: ChatRoomSortOption,
): ChatRoomSortOption {
  return CHAT_ROOM_SORT_OPTIONS_BY_TAB[tabType].includes(sortOption)
    ? sortOption
    : DEFAULT_CHAT_ROOM_SORT_OPTION_BY_TAB[tabType];
}
