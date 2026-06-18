"use client";
// 방송 운영 화면에서 현재 방송 후원 로그를 관리합니다.

import { useEffect, useMemo, useState } from "react";

import type { ChannelLiveRecentDonation } from "@/actions/channel/live";
import { createClient } from "@/lib/supabase/client";
import {
  CHANNEL_LIVE_DONATION_FEED_LIMIT,
  getInitialDonations,
  mapDonationMessagePayload,
} from "@/utils/channel/channel-live-donation-feed";

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
