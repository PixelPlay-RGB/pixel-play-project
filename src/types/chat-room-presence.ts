// 채팅방 Realtime Presence 상태 타입을 정의합니다.

export type ChatRoomPresenceStatus = "online" | "typing";

export interface ChatRoomPresencePayload {
  userId: string;
  roomId: string;
  nickname: string;
  photoUrl: string | null;
  isTyping: boolean;
  typingAt: string | null;
  onlineAt: string;
}

export type ChatRoomPresenceState = Record<string, ChatRoomPresencePayload[]>;

export type ChatRoomMemberPresenceMap = Record<string, ChatRoomPresenceStatus>;
