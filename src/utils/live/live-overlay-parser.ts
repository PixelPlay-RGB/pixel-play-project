// OBS 오버레이 RPC 응답을 화면 타입으로 변환합니다.
import type { Json } from "@/types/database.types";
import type { LiveBroadcastSummary } from "@/types/live/live";
import type {
  LiveChatOverlayItem,
  LiveChatOverlayMessage,
  LiveChatOverlaySnapshot,
} from "@/types/live/live-chat-overlay";
import type {
  LiveDonationAlertOverlayData,
  LiveDonationAlertOverlaySnapshot,
} from "@/types/live/live-donation-alert-overlay";
import { LIVE_DONATION_ALERT_DEFAULT_VISIBLE_MS } from "@/constants/live/live-overlay";

export function parseLiveChatOverlaySnapshot(value: Json): LiveChatOverlaySnapshot | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const broadcast =
    object.broadcast === null ? null : parseLiveChatOverlayBroadcast(object.broadcast);
  const items = readArray(object.items)
    .map(parseLiveChatOverlayItem)
    .filter((item) => item !== null);

  if (object.broadcast !== null && !broadcast) {
    return null;
  }

  return {
    broadcast,
    items,
  };
}

export function parseLiveDonationAlertOverlaySnapshot(
  value: Json,
): LiveDonationAlertOverlaySnapshot | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const broadcastId = object.broadcastId === null ? null : readString(object.broadcastId);
  const creatorName = readString(object.creatorName) ?? "크리에이터";
  const alertVisibleMs =
    readNumber(object.alertVisibleMs) ?? LIVE_DONATION_ALERT_DEFAULT_VISIBLE_MS;
  const donation =
    object.donation === null ? null : parseLiveDonationAlertOverlayData(object.donation);

  if (object.broadcastId !== null && !broadcastId) {
    return null;
  }

  if (object.donation !== null && !donation) {
    return null;
  }

  return {
    broadcastId,
    creatorName,
    alertVisibleMs,
    donation,
  };
}

function parseLiveChatOverlayBroadcast(value: Json | undefined): LiveBroadcastSummary | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);
  const title = readString(object.title);
  const creatorId = readString(object.creatorId);
  const currentViewerCount = readNumber(object.currentViewerCount);
  const startedAt = readString(object.startedAt);

  if (!id || !title || !creatorId || currentViewerCount === null || !startedAt) {
    return null;
  }

  return {
    id,
    title,
    creatorId,
    currentViewerCount,
    startedAt,
  };
}

function parseLiveChatOverlayItem(value: Json): LiveChatOverlayItem | null {
  const object = readObject(value);

  if (!object || object.type !== "message") {
    return null;
  }

  const message = parseLiveChatOverlayMessage(object.message);

  return message
    ? {
        type: "message",
        message,
      }
    : null;
}

function parseLiveChatOverlayMessage(value: Json | undefined): LiveChatOverlayMessage | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);
  const author = readString(object.author);
  const content = readString(object.content);
  const createdAt = readString(object.createdAt);
  const role = object.role === "creator" ? "creator" : undefined;
  const tone = readMessageTone(object.tone);

  if (!id || !author || !content || !createdAt) {
    return null;
  }

  return {
    id,
    author,
    content,
    createdAt,
    role,
    tone,
  };
}

function parseLiveDonationAlertOverlayData(
  value: Json | undefined,
): LiveDonationAlertOverlayData | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);
  const creatorName = readString(object.creatorName);
  const donorName = readString(object.donorName);
  const amount = readNumber(object.amount);
  const message = readText(object.message);
  const createdAt = readString(object.createdAt);

  if (!id || !creatorName || !donorName || amount === null || message === null || !createdAt) {
    return null;
  }

  return {
    id,
    creatorName,
    donorName,
    amount,
    message,
    createdAt,
  };
}

function readObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function readArray(value: Json | undefined): Json[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readText(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readMessageTone(value: Json | undefined): LiveChatOverlayMessage["tone"] {
  return value === "brand" || value === "live" || value === "muted" || value === "default"
    ? value
    : undefined;
}
