// 검색 화면과 검색 결과 타입을 정의합니다.
import type { Database } from "@/types/database.types";

export type SearchScope = "chat" | "live";
export type ChatSearchSection = "title" | "owner";

type ChatSearchRow = Database["public"]["Functions"]["search_chat_rooms"]["Returns"][number];

export type ChatSearchResult = Omit<ChatSearchRow, "section"> & {
  section: ChatSearchSection;
};
