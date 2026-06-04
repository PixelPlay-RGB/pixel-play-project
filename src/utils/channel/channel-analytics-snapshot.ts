// 채널 실시간 통계 snapshot의 화면 표시값을 조립합니다.
import "server-only";

import type {
  AnalyticsBroadcast,
  AnalyticsLogEvent,
  ChannelAnalyticsSnapshot,
} from "@/types/channel/analytics";
import type { Json } from "@/types/database.types";
import { readNumber, readObject, readText } from "@/utils/channel/channel-analytics-read";

export function buildChannelAnalyticsSnapshot(
  creatorId: string,
  snapshot: Json,
): ChannelAnalyticsSnapshot {
  const root = readObject(snapshot);
  const broadcast = readBroadcast(root?.activeBroadcast);

  return {
    creatorId,
    broadcast,
    recentDonations: broadcast ? readRecentDonations(root?.recentDonations, broadcast.id) : [],
  };
}

function readBroadcast(value: unknown): AnalyticsBroadcast | null {
  const broadcast = readObject(value);

  if (!broadcast) {
    return null;
  }

  const id = readText(broadcast.id);
  const startedAt = readText(broadcast.startedAt);

  if (!id || !startedAt) {
    return null;
  }

  return {
    id,
    title: readText(broadcast.title) ?? "",
    startedAt,
    currentViewerCount: readNumber(broadcast.currentViewerCount, 0),
    peakViewerCount: readNumber(broadcast.peakViewerCount, 0),
    chatMessageCount: readNumber(broadcast.chatMessageCount, 0),
    donationCount: readNumber(broadcast.donationCount, 0),
    donationAmountTotal: readNumber(broadcast.donationAmountTotal, 0),
  };
}

function readRecentDonations(value: unknown, broadcastId: string): AnalyticsLogEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => readDonationEvent(item, broadcastId))
    .filter((event): event is AnalyticsLogEvent => event !== null);
}

function readDonationEvent(value: unknown, broadcastId: string): AnalyticsLogEvent | null {
  const donation = readObject(value);

  if (!donation || readText(donation.broadcastId) !== broadcastId) {
    return null;
  }

  const id = readText(donation.id);
  const at = readText(donation.createdAt);

  if (!id || !at) {
    return null;
  }

  return { id, type: "donation", at, amount: readNumber(donation.amount, 0) };
}
