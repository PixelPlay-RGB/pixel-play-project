import { GenericTables } from "@/types/supabase.types";

/**
 * public.message 테이블 row
 */
export type Message = GenericTables<"message">;

/**
 * public.chatroom 테이블 row
 */
export type Room = GenericTables<"chatroom">;

/**
 * public.chatroommember 테이블 row
 */
export type RoomMember = GenericTables<"chatroommember">;

/**
 * 룸 멤버 정보와 유저 프로필(nickname)을 함께 가져오는 쿼리용 타입
 * (기존 RoomMember 타입을 확장하여 사용)
 */
export interface RoomMemberQuery extends RoomMember {
  user: {
    nickname: string | null;
  } | null;
}