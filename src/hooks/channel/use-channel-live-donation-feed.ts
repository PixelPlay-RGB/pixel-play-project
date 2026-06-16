// 방송 운영 화면에서 현재 방송 후원 로그를 관리합니다.
"use client";

import { useEffect, useMemo, useState } from "react";

import type { ChannelLiveRecentDonation } from "@/actions/channel/live";
import type { Json } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

const CHANNEL_LIVE_DONATION_FEED_LIMIT = 30;
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

function sortDonationsDescending(donations: ChannelLiveRecentDonation[]) {
  return [...donations].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function getInitialDonations(
  broadcastId: string | null | undefined,
  initialDonations: ChannelLiveRecentDonation[],
) {
  if (!broadcastId) return EMPTY_DONATIONS;

  return sortDonationsDescending(
    initialDonations.filter((donation) => donation.broadcastId === broadcastId),
  ).slice(0, CHANNEL_LIVE_DONATION_FEED_LIMIT);
}

function mapDonationMessagePayload(
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

export function useChannelLiveDonationFeed(
  broadcastId: string | null | undefined,
  initialDonations: ChannelLiveRecentDonation[],
) {
  const initialFeed = useMemo(
    () => getInitialDonations(broadcastId, initialDonations),
    [broadcastId, initialDonations],
  );
  const [donations, setDonations] = useState<ChannelLiveRecentDonation[]>(initialFeed);

  useEffect(() => {
    if (!broadcastId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`channel-live-donations:${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        (payload) => {
          const nextDonation = mapDonationMessagePayload(payload.new, broadcastId);

          if (!nextDonation) return;

          setDonations((prev) => {
            if (prev.some((donation) => donation.id === nextDonation.id)) {
              return prev;
            }

            return [nextDonation, ...prev].slice(0, CHANNEL_LIVE_DONATION_FEED_LIMIT);
          });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId]);

  return donations;
}
