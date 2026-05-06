import type { Database } from "@/types/database.types";
import { GenericTables } from "@/types/supabase.types";

export type ChatRoomByTab = Database["public"]["Functions"]["get_rooms_by_tab"]["Returns"][number];
export type ChatRoomTab = "JOINED" | "NOT_JOINED" | "OWNED";

export type ChatRoom = GenericTables<"chat_room">;
