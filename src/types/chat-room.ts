import type { Database } from "@/types/database.types";
import { GenericTables } from "@/types/supabase.types";

export type ChatRoomByTab = Database["public"]["Functions"]["get_rooms_by_tab"]["Returns"][number];
/** get_rooms_by_tab_count RPC 한 행 (목록 + 안읽음 개수) */
export type ChatRoomByTabWithUnreadCount =
  Database["public"]["Functions"]["get_rooms_by_tab_count"]["Returns"][number];
export type ChatRoomTab = "JOINED" | "NOT_JOINED" | "OWNED";

export type ChatRoom = GenericTables<"chat_room">;
