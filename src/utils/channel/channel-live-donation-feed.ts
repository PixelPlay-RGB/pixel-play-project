// 방송 운영 후원 피드의 정렬·초기값·실시간 페이로드 매핑 순수 함수를 제공합니다.

import type { ChannelLiveRecentDonation } from "@/actions/channel/live";
import type { Json } from "@/types/database.types";

export const CHANNEL_LIVE_DONATION_FEED_LIMIT = 30;

const EMPTY_DONATIONS: ChannelLiveRecentDonation[] = [];

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readJsonObject(value: unknown): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

function readString(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function sortDonationsDescending(donations: ChannelLiveRecentDonation[]) {
  return [...donations].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function getInitialDonations(
  broadcastId: string | null | undefined,
  initialDonations: ChannelLiveRecentDonation[],
) {
  if (!broadcastId) return EMPTY_DONATIONS;

  return sortDonationsDescending(
    initialDonations.filter((donation) => donation.broadcastId === broadcastId),
  ).slice(0, CHANNEL_LIVE_DONATION_FEED_LIMIT);
}

export function mapDonationMessagePayload(
  value: unknown,
  expectedBroadcastId: string,
): ChannelLiveRecentDonation | null {
  const row = readObject(value);

  if (
    !row ||
    readString(row.broadcast_id) !== expectedBroadcastId ||
    readString(row.message_type) !== "donation"
  ) {
    return null;
  }

  const metadata = readJsonObject(row.metadata);
  const amount = readNumber(metadata.amount);
  const createdAt = readString(row.created_at);
  const id = readString(row.donation_id) ?? readString(row.id);

  if (!id || !createdAt || !amount || amount <= 0) {
    return null;
  }

  return {
    amount,
    broadcastId: expectedBroadcastId,
    createdAt,
    donorNickname: readString(metadata.donorNickname) ?? "익명",
    id,
  };
}
