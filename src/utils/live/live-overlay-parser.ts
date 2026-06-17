// OBS 오버레이 RPC 응답을 화면 타입으로 변환합니다.
import { DONATION_ALERT_SOUND_DEFAULT } from "@/constants/channel/donation";
import {
  LIVE_DONATION_ALERT_DEFAULT_VISIBLE_MS,
  LIVE_OVERLAY_DEFAULT_CREATOR_NAME,
} from "@/constants/live/live-overlay";
import type { Json } from "@/types/database.types";
import type { LiveBroadcastSummary, LiveSenderRole } from "@/types/live/live";
import type {
  LiveChatOverlayItem,
  LiveChatOverlayMessage,
  LiveChatOverlaySnapshot,
} from "@/types/live/live-chat-overlay";
import type {
  LiveDonationAlertAudioSettings,
  LiveDonationAlertOverlayData,
  LiveDonationAlertOverlaySnapshot,
} from "@/types/live/live-donation-alert-overlay";

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
    donationMessageEnabled: object.donationMessageEnabled === true,
    donationAmountVisible: object.donationAmountVisible !== false,
    items,
  };
}

export function parseLiveDonationAlertOverlaySnapshot(
  value: Json,
  fallbackCreatorId?: string,
): LiveDonationAlertOverlaySnapshot | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const creatorId = readString(object.creatorId) ?? readString(fallbackCreatorId);
  const broadcastId = object.broadcastId === null ? null : readString(object.broadcastId);
  const creatorName = readString(object.creatorName) ?? LIVE_OVERLAY_DEFAULT_CREATOR_NAME;
  const alertVisibleMs =
    readPositiveNumber(object.alertVisibleMs) ?? LIVE_DONATION_ALERT_DEFAULT_VISIBLE_MS;
  const donation =
    object.donation === null ? null : parseLiveDonationAlertOverlayData(object.donation);

  if (!creatorId) {
    return null;
  }

  if (object.broadcastId !== null && !broadcastId) {
    return null;
  }

  if (object.donation !== null && !donation) {
    return null;
  }

  const audio: LiveDonationAlertAudioSettings = {
    alertSoundEnabled: object.alertSoundEnabled !== false,
    alertSoundKey: readString(object.alertSoundKey) ?? DONATION_ALERT_SOUND_DEFAULT,
    alertVolume: readNumber(object.alertVolume) ?? 32,
    ttsEnabled: object.ttsEnabled !== false,
    ttsRate: readNumber(object.ttsRate) ?? 1,
    ttsVolume: readNumber(object.ttsVolume) ?? 80,
    ttsVoiceUri: readString(object.ttsVoiceUri) ?? "",
    amountVisible: object.amountVisible !== false,
  };

  return {
    creatorId,
    broadcastId,
    creatorName,
    alertVisibleMs,
    audio,
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
  const content = readText(object.content);
  const createdAt = readString(object.createdAt);
  const kind = object.kind === "donation" ? "donation" : "chat";
  const amount = readNumber(object.amount);
  const roles = Array.isArray(object.roles)
    ? object.roles.filter(
        (value): value is Exclude<LiveSenderRole, "viewer"> =>
          value === "creator" || value === "manager" || value === "donor" || value === "subscriber",
      )
    : undefined;
  const tone = readMessageTone(object.tone);

  if (!id || !author || content === null || !createdAt) {
    return null;
  }

  return {
    id,
    kind,
    author,
    content,
    createdAt,
    amount,
    roles,
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
  // 금액 숨김(amountVisible=false) 시 amount는 null로 내려오므로 필수 검증에서 제외합니다.
  const amount = readNumber(object.amount);
  const message = readText(object.message);
  const createdAt = readString(object.createdAt);

  if (!id || !creatorName || !donorName || message === null || !createdAt) {
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
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed.length > 0 ? trimmed : null;
}

function readText(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readPositiveNumber(value: Json | undefined) {
  const number = readNumber(value);

  return number !== null && number > 0 ? number : null;
}

function readMessageTone(value: Json | undefined): LiveChatOverlayMessage["tone"] {
  return value === "brand" || value === "live" || value === "muted" || value === "default"
    ? value
    : undefined;
}
