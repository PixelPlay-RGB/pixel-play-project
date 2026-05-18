// 채팅방 Presence payload를 생성하고 멤버별 표시 상태를 계산합니다.

import {
  CHAT_ROOM_PRESENCE_CHANNEL_PREFIX,
  CHAT_ROOM_PRESENCE_STALE_TIMEOUT_MS,
} from "@/constants/chat-room-presence";
import type {
  ChatRoomMemberPresenceMap,
  ChatRoomPresencePayload,
  ChatRoomPresenceState,
  ChatRoomPresenceStatus,
} from "@/types/chat-room-presence";

interface CreatePresencePayloadParams {
  roomId: string;
  userId: string;
  nickname: string;
  photoUrl: string | null;
  isTyping: boolean;
  onlineAt: string;
  nowIso: string;
}

export function createChatRoomPresenceChannelName(roomId: string): string {
  return `${CHAT_ROOM_PRESENCE_CHANNEL_PREFIX}-${roomId}`;
}

export function createChatRoomPresencePayload({
  roomId,
  userId,
  nickname,
  photoUrl,
  isTyping,
  onlineAt,
  nowIso,
}: CreatePresencePayloadParams): ChatRoomPresencePayload {
  return {
    userId,
    roomId,
    nickname,
    photoUrl,
    isTyping,
    typingAt: isTyping ? nowIso : null,
    onlineAt,
  };
}

function isActiveTypingPayload(payload: ChatRoomPresencePayload, nowMs: number): boolean {
  if (!payload.isTyping || !payload.typingAt) {
    return false;
  }

  const typingAtMs = Date.parse(payload.typingAt);

  if (Number.isNaN(typingAtMs)) {
    return false;
  }

  return nowMs - typingAtMs <= CHAT_ROOM_PRESENCE_STALE_TIMEOUT_MS;
}

function resolvePresenceStatus(
  payloads: ChatRoomPresencePayload[],
  nowMs: number,
): ChatRoomPresenceStatus {
  return payloads.some((payload) => isActiveTypingPayload(payload, nowMs)) ? "typing" : "online";
}

export function resolveChatRoomMemberPresenceMap(
  presenceState: ChatRoomPresenceState,
  nowMs: number,
): ChatRoomMemberPresenceMap {
  return Object.values(presenceState).reduce<ChatRoomMemberPresenceMap>((acc, payloads) => {
    for (const payload of payloads) {
      if (!payload.userId) {
        continue;
      }

      const previousStatus = acc[payload.userId];
      const nextStatus = resolvePresenceStatus([payload], nowMs);

      acc[payload.userId] =
        previousStatus === "typing" || nextStatus === "typing" ? "typing" : nextStatus;
    }

    return acc;
  }, {});
}
