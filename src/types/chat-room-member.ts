import { GenericTables } from "@/types/supabase.types";

/**
 * public.chat_room_member 테이블
 */
export type RoomMember = GenericTables<"chat_room_member">;

/**
 * 룸 멤버 정보와 유저 프로필(nickname)을 함께 가져오는 쿼리용 타입
 */
export interface RoomMemberQuery extends RoomMember {
  user: {
    nickname: string;
    photo_url: string | null;
  };
}

/** user_id → 채팅 UI용 표시 정보 (메시지 목록 등에서 O(1) 조회) */
export type MemberDisplayByUserId = Record<
  string,
  { nickname: string; photoUrl: string | null }
>;
