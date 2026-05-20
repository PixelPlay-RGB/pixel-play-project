// message 도메인 타입을 정의합니다.
import { GenericTables } from "@/types/common/supabase.types";

/**
 * public.message 테이블 row
 */
export type Message = GenericTables<"message">;

export interface MessageQuery extends Message {
  user: {
    nickname: string;
    photo_url: string | null;
  };
}

export type MessageClientStatus = "sending" | "failed";

export interface MessageListItem extends MessageQuery {
  clientStatus?: MessageClientStatus;
}

export interface MessagesPage {
  items: MessageListItem[];
  nextCursor?: string;
}

export interface SendMessageVariables {
  content: string;
  optimisticMessageId?: string;
}
