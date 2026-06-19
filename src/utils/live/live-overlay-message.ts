// 라이브 메시지 row를 OBS 오버레이 표시 데이터로 변환합니다.
import { LIVE_LABEL } from "@/constants/live/live";
import {
  LIVE_OVERLAY_DEFAULT_CREATOR_NAME,
  LIVE_OVERLAY_DEFAULT_VIEWER_NAME,
} from "@/constants/live/live-overlay";
import { readJsonObject, readNumber, readString } from "@/utils/common/json";
import { containsSeedProfanity } from "@/utils/live/live-chat";
import { deriveSenderRoles } from "@/utils/live/live-message";
import type { LiveMessageRow } from "@/types/live/live";
import type { LiveChatOverlayItem, LiveChatOverlayMessage } from "@/types/live/live-chat-overlay";
import type { LiveDonationAlertOverlayData } from "@/types/live/live-donation-alert-overlay";

interface OverlayMessageOptions {
  creatorId: string;
  authorFallback?: string;
  creatorName?: string;
  donationMessageEnabled?: boolean;
  amountVisible?: boolean;
}

export function mapLiveMessageToChatOverlayItem(
  message: LiveMessageRow,
  options: OverlayMessageOptions,
): LiveChatOverlayItem | null {
  if (message.message_type === "chat") {
    const metadata = readJsonObject(message.metadata);
    const author =
      readString(metadata.senderNickname) ??
      options.authorFallback ??
      LIVE_OVERLAY_DEFAULT_VIEWER_NAME;
    const isCreator = message.sender_id === options.creatorId;
    const isDonor = metadata.isDonor === true;
    const isSubscriber = metadata.isSubscriber === true;

    // OBS 채팅 오버레이도 시청 채팅과 동일하게 클린봇 비속어를 가린다(원문 노출 방지) — 서버 LLM
    // 판정(cleanbotStatus)을 우선하고, 판정 전엔 클라 시드 사전으로 명백한 욕설을 즉시 가린다.
    const cleanbotStatus = readString(metadata.cleanbotStatus);
    const isCleanbotFlagged =
      cleanbotStatus === "flagged" ||
      (cleanbotStatus === null && containsSeedProfanity(message.content));

    const isHost = message.sender_role === "creator" || message.sender_id === options.creatorId;
    const overlayMessage: LiveChatOverlayMessage = {
      id: message.id,
      creatorId: options.creatorId,
      kind: "chat",
      author,
      content: isCleanbotFlagged ? LIVE_LABEL.cleanbotHidden : message.content,
      createdAt: message.created_at,
      // 시청 채팅과 동일 규칙으로 동시 보유 역할을 모두 뱃지로(공용 deriveSenderRoles).
      roles: deriveSenderRoles({
        isHost,
        senderRole: message.sender_role,
        isDonor: metadata.isDonor === true,
        isSubscriber: metadata.isSubscriber === true,
      }),
      // 구독 N개월 티콘(LiveSubscriptionBadge)용 데이터 — 구독 기능 보존.
      isSubscriber,
      subscriptionTotalMonths: readNumber(metadata.subscriptionTotalMonths),
      role: isCreator ? "creator" : isDonor ? "donor" : isSubscriber ? "subscriber" : undefined,
      tone: isHost ? "brand" : undefined,
    };

    return {
      type: "message",
      message: overlayMessage,
    };
  }

  // 채팅창 후원 메시지 출력이 켜져 있을 때만 후원 메시지를 채팅 오버레이에 노출합니다.
  if (message.message_type === "donation" && options.donationMessageEnabled) {
    const metadata = readJsonObject(message.metadata);
    const author =
      readString(metadata.donorNickname) ??
      options.authorFallback ??
      LIVE_OVERLAY_DEFAULT_VIEWER_NAME;
    const amount = options.amountVisible === false ? null : readNumber(metadata.amount);

    const overlayMessage: LiveChatOverlayMessage = {
      id: message.id,
      creatorId: options.creatorId,
      kind: "donation",
      author,
      content: message.content,
      createdAt: message.created_at,
      amount,
    };

    return {
      type: "message",
      message: overlayMessage,
    };
  }

  return null;
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
    creatorName: options.creatorName ?? LIVE_OVERLAY_DEFAULT_CREATOR_NAME,
    donorName:
      readString(metadata.donorNickname) ??
      options.authorFallback ??
      LIVE_OVERLAY_DEFAULT_VIEWER_NAME,
    amount,
    message: message.content,
    createdAt: message.created_at,
  };
}
