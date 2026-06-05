// live_message 조인 조회 결과를 라이브 채팅 메시지 도메인 타입으로 변환합니다.

import { LIVE_LABEL } from "@/constants/live/live";
import { isCleanbotFlagged } from "@/utils/live/live-chat";
import { readJsonObject, readNumber, readString } from "@/utils/common/json";
import type { LiveChatMessage } from "@/types/live/live";
import type { Json } from "@/types/database.types";

export interface LiveMessageJoinedRow {
  id: string;
  sender_id: string | null;
  message_type: "chat" | "moderation_notice" | "donation";
  content: string;
  metadata: Json;
  sender: { nickname: string; photo_url: string | null } | null;
  donation: { amount: number } | null;
}

// creatorId(크리에이터 user UUID)와 sender_id가 같으면 호스트 메시지로 표시한다.
// creatorId가 user UUID가 아니게 되면(예: 핸들) 매칭이 빗나가 호스트 강조만 사라지고 동작은 안전하게 유지된다.
// viewerId(보는 사람 user UUID)와 sender_id가 같으면 본인 메시지이므로 클린봇으로 가리지 않는다.
export function mapLiveMessageRowToMessage(
  row: LiveMessageJoinedRow,
  creatorId?: string,
  viewerId?: string,
): LiveChatMessage {
  const isHost = !!creatorId && row.sender_id !== null && row.sender_id === creatorId;
  const isOwnMessage = !!viewerId && row.sender_id !== null && row.sender_id === viewerId;
  const metadata = readJsonObject(row.metadata);

  if (row.message_type === "donation") {
    const metadataAmount = readNumber(metadata.amount);
    const metadataAuthor = readString(metadata.donorNickname);

    return {
      id: row.id,
      type: "donation",
      author: row.sender?.nickname ?? metadataAuthor ?? LIVE_LABEL.anonymousAuthor,
      content: row.content,
      donationAmount: row.donation?.amount ?? metadataAmount ?? undefined,
    };
  }

  if (row.message_type === "moderation_notice") {
    return {
      id: row.id,
      type: "system",
      content: row.content,
    };
  }

  return {
    id: row.id,
    type: "text",
    author:
      row.sender?.nickname ?? readString(metadata.senderNickname) ?? LIVE_LABEL.anonymousAuthor,
    content: row.content,
    isHost,
    // 본인 메시지는 본인 화면에서 안 가린다. refetch 재매핑 시에도 일관 유지된다.
    isCleanbotFlagged: !isOwnMessage && isCleanbotFlagged(row.content),
  };
}

// Realtime INSERT payload(join이 없는 raw live_message row)를 도메인 메시지로 변환한다.
// metadata에 senderNickname / donorNickname / amount 가 들어 있어 단건 재조회 없이 바로 매핑할 수 있다.
export function mapLiveMessageRealtimePayload(
  raw: unknown,
  creatorId?: string,
  viewerId?: string,
): LiveChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  const id = typeof record.id === "string" ? record.id : "";
  const messageType = record.message_type;
  if (
    !id ||
    (messageType !== "chat" && messageType !== "moderation_notice" && messageType !== "donation")
  ) {
    return null;
  }

  return mapLiveMessageRowToMessage(
    {
      id,
      sender_id: typeof record.sender_id === "string" ? record.sender_id : null,
      message_type: messageType,
      content: typeof record.content === "string" ? record.content : "",
      metadata: (record.metadata ?? null) as Json,
      sender: null,
      donation: null,
    },
    creatorId,
    viewerId,
  );
}
