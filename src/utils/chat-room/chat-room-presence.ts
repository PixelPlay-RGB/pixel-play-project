// 채팅방 Presence payload를 생성하고 멤버별 표시 상태를 계산합니다.

import { CHAT_ROOM_PRESENCE_CHANNEL_PREFIX } from "@/constants/chat-room/chat-room-presence";
import type {
  ChatRoomMemberPresenceMap,
  ChatRoomPresencePayload,
  ChatRoomPresenceState,
  ChatRoomTypingBroadcastPayload,
  ChatRoomTypingMemberMap,
} from "@/types/chat-room/chat-room-presence";

interface CreatePresencePayloadParams {
  roomId: string;
  userId: string;
  nickname: string;
  photoUrl: string | null;
  onlineAt: string;
}

interface CreateTypingBroadcastPayloadParams {
  roomId: string;
  userId: string;
  isTyping: boolean;
  nowIso: string;
}

export function createChatRoomPresenceChannelName(roomId: string): string {
  return `${CHAT_ROOM_PRESENCE_CHANNEL_PREFIX}-${roomId}`;
}

export function createChatRoomPresenceRealtimeTopic(roomId: string): string {
  return `realtime:${createChatRoomPresenceChannelName(roomId)}`;
}

export function createChatRoomPresencePayload({
  roomId,
  userId,
  nickname,
  photoUrl,
  onlineAt,
}: CreatePresencePayloadParams): ChatRoomPresencePayload {
  return {
    userId,
    roomId,
    nickname,
    photoUrl,
    onlineAt,
  };
}

export function createChatRoomTypingBroadcastPayload({
  roomId,
  userId,
  isTyping,
  nowIso,
}: CreateTypingBroadcastPayloadParams): ChatRoomTypingBroadcastPayload {
  return {
    roomId,
    userId,
    isTyping,
    updatedAt: nowIso,
  };
}

export function pruneChatRoomTypingMemberMap(
  typingMembers: ChatRoomTypingMemberMap,
  nowMs: number,
): ChatRoomTypingMemberMap {
  return Object.entries(typingMembers).reduce<ChatRoomTypingMemberMap>(
    (acc, [userId, expiresAtMs]) => {
      if (expiresAtMs > nowMs) {
        acc[userId] = expiresAtMs;
      }

      return acc;
    },
    {},
  );
}

export function resolveChatRoomMemberPresenceMap(
  presenceState: ChatRoomPresenceState,
  activeTypingUserIds: string[] = [],
): ChatRoomMemberPresenceMap {
  const typingUserIdSet = new Set(activeTypingUserIds);
  const memberPresence = activeTypingUserIds.reduce<ChatRoomMemberPresenceMap>((acc, userId) => {
    acc[userId] = "typing";

    return acc;
  }, {});

  return Object.values(presenceState).reduce<ChatRoomMemberPresenceMap>((acc, payloads) => {
    for (const payload of payloads) {
      if (!payload.userId) {
        continue;
      }

      acc[payload.userId] = typingUserIdSet.has(payload.userId) ? "typing" : "online";
    }

    return acc;
  }, memberPresence);
}
