import type { Database } from "@/types/database.types";

export type ChatRoom = Database["public"]["Functions"]["get_rooms_by_tab"]["Returns"][number];

export type ChatRoomTab = "JOINED" | "NOT_JOINED" | "OWNED";
