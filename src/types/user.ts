import { Database } from "@/types/database.types";
import { User as AuthUser } from "@supabase/supabase-js";

type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

/**
 * Supabase auth.users 기반 인증 유저 (세션/쿠키에서 유래)
 */
export type { AuthUser };

/**
 * public.user 테이블 row (프로필 정보)
 */
export type DBUser = Tables<"user">;
