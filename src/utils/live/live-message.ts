import type { LiveChatMessage } from "@/types/live/live";

export interface LiveMessageRow {
  id: string;
  message_type: "chat" | "moderation_notice" | "donation";
  content: string;
  sender: { nickname: string; photo_url: string | null } | null;
  donation: { amount: number } | null;
}

export function mapLiveMessageRowToMessage(row: LiveMessageRow): LiveChatMessage {
  if (row.message_type === "donation") {
    return {
      id: row.id,
      type: "donation",
      author: row.sender?.nickname ?? "익명",
      content: row.content,
      donationAmount: row.donation?.amount,
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
    author: row.sender?.nickname ?? "익명",
    content: row.content,
  };
}
