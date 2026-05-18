// supabase.types 도메인 타입을 정의합니다.
import { Database } from "@/types/database.types";

export type GenericTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
