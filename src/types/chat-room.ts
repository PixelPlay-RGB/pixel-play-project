import type { Database } from "@/types/database.types";
import { GenericTables } from "@/types/supabase.types";

export type ChatRoomByTab = Database["public"]["Functions"]["get_rooms_by_tab"]["Returns"][number];
/** get_rooms_by_tab_count RPC 한 행 (목록 + 안읽음 개수) */
export type ChatRoomByTabWithUnreadCount =
  Database["public"]["Functions"]["get_rooms_by_tab_count"]["Returns"][number];
export type ChatRoomTab = "JOINED" | "NOT_JOINED" | "OWNED";

export type ChatRoom = GenericTables<"chat_room">;

export type ChatRoomCardData = Pick<
  ChatRoomByTab,
  "id" | "title" | "description" | "owner_nickname" | "current_member" | "max_capacity" | "created_at"
>;

// 모든 탭 키가 항상 존재하는 타입 (로딩 중 여부는 쿼리 반환값 자체가 undefined인지로 판단)
export type ChatRoomCounts = Record<ChatRoomTab, number>;
