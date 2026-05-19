// user 도메인 타입을 정의합니다.
import { GenericTables } from "@/types/common/supabase.types";
import { User as AuthUser } from "@supabase/supabase-js";

/**
 * Supabase auth.users 기반 인증 유저 (세션/쿠키에서 유래)
 */
export type { AuthUser };

/**
 * public.user 테이블 row (프로필 정보)
 */
export type DBUser = GenericTables<"user">;
