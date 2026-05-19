// chat-room 도메인 타입을 정의합니다.
import type { Database } from "@/types/database.types";
import { GenericTables } from "@/types/common/supabase.types";

export type ChatRoomTab = "JOINED" | "NOT_JOINED" | "OWNED";
export type ChatRoomSortOption = "CREATED_AT_DESC" | "LAST_MESSAGE_DESC" | "CURRENT_MEMBER_DESC";

export type ChatRoom = GenericTables<"chat_room">;

export type ChatRoomDetailResponse =
  Database["public"]["Functions"]["get_chat_room_detail"]["Returns"][number];

export type ChatRoomListResponse =
  Database["public"]["Functions"]["get_chat_room_list"]["Returns"][number];

export interface ChatRoomListItem {
  id: string;
  title: string;
  description: string | null;
  max_capacity: number;
  current_member: number;
  owner_id: string;
  owner_nickname: string;
  created_at: string;
  unread_count: number;
}

export type ChatRoomCardData = Pick<
  ChatRoomListItem,
  | "id"
  | "title"
  | "description"
  | "owner_nickname"
  | "current_member"
  | "max_capacity"
  | "created_at"
>;

// 모든 탭 키가 항상 존재하는 타입 (로딩 중 여부는 쿼리 반환값 자체가 undefined인지로 판단)
export type ChatRoomCounts = Record<ChatRoomTab, number>;
