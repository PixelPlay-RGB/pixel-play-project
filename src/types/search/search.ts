// 라이브 검색 결과 타입을 정의합니다.
import type { Database } from "@/types/database.types";

export type LiveSearchSection = "broadcast" | "creator";

export type LiveSearchRpcRow =
  Database["public"]["Functions"]["search_live_results"]["Returns"][number];

export type LiveSearchResult = Omit<
  LiveSearchRpcRow,
  "broadcast_id" | "section" | "started_at" | "thumbnail_url" | "title"
> & {
  broadcast_id: string | null;
  section: LiveSearchSection;
  started_at: string | null;
  thumbnail_url: string | null;
  title: string | null;
};
