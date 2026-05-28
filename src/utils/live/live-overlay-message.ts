// 라이브 메시지 row를 OBS 오버레이 표시 데이터로 변환합니다.
import type { Json } from "@/types/database.types";
import type { LiveMessageRow } from "@/types/live/live";
import type { LiveChatOverlayItem, LiveChatOverlayMessage } from "@/types/live/live-chat-overlay";
import type { LiveDonationAlertOverlayData } from "@/types/live/live-donation-alert-overlay";

interface OverlayMessageOptions {
  creatorId: string;
  authorFallback?: string;
  creatorName?: string;
}

export function mapLiveMessageToChatOverlayItem(
  message: LiveMessageRow,
  options: OverlayMessageOptions,
): LiveChatOverlayItem | null {
  if (message.message_type !== "chat") {
    return null;
  }

  const metadata = readJsonObject(message.metadata);
  const author = readString(metadata.senderNickname) ?? options.authorFallback ?? "시청자";

  const overlayMessage: LiveChatOverlayMessage = {
    id: message.id,
    author,
    content: message.content,
    createdAt: message.created_at,
    role: message.sender_id === options.creatorId ? "creator" : undefined,
    tone: message.sender_id === options.creatorId ? "brand" : undefined,
  };

  return {
    type: "message",
    message: overlayMessage,
  };
}

export function mapLiveMessageToDonationAlert(
  message: LiveMessageRow,
  options: OverlayMessageOptions,
): LiveDonationAlertOverlayData | null {
  if (message.message_type !== "donation") {
    return null;
  }

  const metadata = readJsonObject(message.metadata);
  const amount = readNumber(metadata.amount);

  if (amount === null) {
    return null;
  }

  return {
    id: message.donation_id ?? message.id,
    creatorName: options.creatorName ?? "크리에이터",
    donorName: readString(metadata.donorNickname) ?? options.authorFallback ?? "시청자",
    amount,
    message: message.content,
    createdAt: message.created_at,
  };
}

function readJsonObject(value: Json): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json | undefined>;
}

function readString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
