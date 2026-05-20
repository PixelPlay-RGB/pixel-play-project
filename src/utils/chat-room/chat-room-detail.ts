// 채팅방 상세 RPC 응답을 화면 모델로 정규화합니다.

import type {
  ChatRoom,
  ChatRoomDetailData,
  ChatRoomDetailResponse,
} from "@/types/chat-room/chat-room";
import type { RoomMember, RoomMemberQuery } from "@/types/chat-room/chat-room-member";
import type { Json } from "@/types/database.types";

type JsonRecord = { [key: string]: Json | undefined };

export const EMPTY_CHAT_ROOM_DETAIL: ChatRoomDetailData = {
  room: null,
  membership: null,
  members: [],
};

function isJsonRecord(value: Json): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: Json | undefined): value is string | null {
  return value === null || typeof value === "string";
}

function parseRoom(value: Json): ChatRoom | null {
  if (!isJsonRecord(value)) {
    return null;
  }

  const {
    id,
    owner_id,
    title,
    description,
    max_capacity,
    current_member,
    created_at,
    modified_at,
  } = value;

  if (
    typeof id !== "string" ||
    typeof owner_id !== "string" ||
    typeof title !== "string" ||
    !isNullableString(description) ||
    typeof max_capacity !== "number" ||
    typeof current_member !== "number" ||
    typeof created_at !== "string" ||
    typeof modified_at !== "string"
  ) {
    return null;
  }

  return {
    id,
    owner_id,
    title,
    description,
    max_capacity,
    current_member,
    created_at,
    modified_at,
  };
}

function parseMembership(value: Json): RoomMember | null {
  if (value === null) {
    return null;
  }

  if (!isJsonRecord(value)) {
    return null;
  }

  const { id, user_id, chat_room_id, last_joined_at, last_read_at, created_at, is_banned } = value;

  if (
    typeof id !== "string" ||
    typeof user_id !== "string" ||
    typeof chat_room_id !== "string" ||
    !isNullableString(last_joined_at) ||
    !isNullableString(last_read_at) ||
    typeof created_at !== "string" ||
    typeof is_banned !== "boolean"
  ) {
    return null;
  }

  return {
    id,
    user_id,
    chat_room_id,
    last_joined_at,
    last_read_at,
    created_at,
    is_banned,
  };
}

function parseMemberProfile(value: Json | undefined): RoomMemberQuery["user"] | null {
  if (value === undefined) {
    return null;
  }

  if (!isJsonRecord(value)) {
    return null;
  }

  const { nickname, photo_url } = value;

  if (typeof nickname !== "string" || !isNullableString(photo_url)) {
    return null;
  }

  return {
    nickname,
    photo_url,
  };
}

function parseMember(value: Json): RoomMemberQuery | null {
  const membership = parseMembership(value);

  if (!membership || !isJsonRecord(value)) {
    return null;
  }

  const user = parseMemberProfile(value.user);

  if (!user) {
    return null;
  }

  return {
    ...membership,
    user,
  };
}

function parseMembers(value: Json): RoomMemberQuery[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((member) => {
    const parsedMember = parseMember(member);
    return parsedMember ? [parsedMember] : [];
  });
}

export function parseChatRoomDetail(
  response: ChatRoomDetailResponse | null | undefined,
): ChatRoomDetailData {
  if (!response) {
    return EMPTY_CHAT_ROOM_DETAIL;
  }

  return {
    room: parseRoom(response.room),
    membership: parseMembership(response.membership),
    members: parseMembers(response.members),
  };
}
