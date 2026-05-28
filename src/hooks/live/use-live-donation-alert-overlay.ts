"use client";
// OBS 후원 알림 오버레이의 실시간 후원 표시 상태를 관리합니다.

import { LIVE_DONATION_ALERT_VISIBLE_MS } from "@/constants/live/live-overlay";
import { createClient } from "@/lib/supabase/client";
import type { LiveMessageRow } from "@/types/live/live";
import type {
  LiveDonationAlertOverlayData,
  LiveDonationAlertOverlaySnapshot,
} from "@/types/live/live-donation-alert-overlay";
import { mapLiveMessageToDonationAlert } from "@/utils/live/live-overlay-message";
import { useEffect, useState } from "react";

export function useLiveDonationAlertOverlay(initialSnapshot: LiveDonationAlertOverlaySnapshot) {
  const [donation, setDonation] = useState<LiveDonationAlertOverlayData | null>(
    initialSnapshot.donation,
  );
  const [isVisible, setIsVisible] = useState(Boolean(initialSnapshot.donation));

  useEffect(() => {
    if (!initialSnapshot.broadcastId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`live-donation-alert-overlay:${initialSnapshot.broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `broadcast_id=eq.${initialSnapshot.broadcastId}`,
        },
        (payload) => {
          const message = payload.new as LiveMessageRow;

          if (message.message_type !== "donation") {
            return;
          }

          const nextDonation = mapLiveMessageToDonationAlert(message, {
            creatorId: "",
            creatorName: initialSnapshot.creatorName,
          });

          if (nextDonation) {
            setDonation(nextDonation);
            setIsVisible(true);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initialSnapshot.broadcastId, initialSnapshot.creatorName]);

  useEffect(() => {
    if (!donation || !isVisible) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsVisible(false);
    }, LIVE_DONATION_ALERT_VISIBLE_MS);

    return () => window.clearTimeout(timerId);
  }, [donation, isVisible]);

  return {
    donation,
    isVisible,
  };
}
