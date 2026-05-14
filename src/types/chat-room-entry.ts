// 채팅방 입장 상태와 서버 초기 조회 결과 타입을 정의합니다.

import type { ChatRoom } from "@/types/chat-room";

export type EntryStatus = "loading" | "active" | "new" | "left" | "banned" | "error";

export type InitialEntryStatus = Exclude<EntryStatus, "loading" | "error">;

export type DialogEntryStatus = "new" | "full";

export interface ChatRoomEntryMembership {
  is_banned: boolean;
  last_joined_at: string | null;
}

export interface ChatRoomInitialView {
  room: ChatRoom;
  entryStatus?: InitialEntryStatus;
  entryMembership?: ChatRoomEntryMembership | null;
  userId: string;
}

export type ChatRoomPrecheckResult =
  | { status: "ready"; initialView: ChatRoomInitialView }
  | { status: "unauthenticated" }
  | { status: "not_found" };
