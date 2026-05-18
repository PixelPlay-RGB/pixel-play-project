// message 도메인 타입을 정의합니다.
import { GenericTables } from "@/types/supabase.types";

/**
 * public.message 테이블 row
 */
export type Message = GenericTables<"message">;

export interface MessageQuery extends Message {
  user: {
    nickname: string;
    photo_url: string | null;
  };
  /** 클라이언트 전용: DB 전송 실패 시 재전송·취소 UI */
  clientFailed?: boolean;
}
