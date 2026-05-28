"use client";
// OBS 브라우저 소스에 붙이는 후원 알림 화면을 렌더링합니다.
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { LIVE_DONATION_ALERT_VISIBLE_MS } from "@/constants/live/live-overlay";
import {
  liveDonationAlertContainerVariants,
  liveDonationAlertIconVariants,
  liveDonationAlertTextVariants,
} from "@/lib/framer-motion/live-overlay";
import type { LiveMessageRow } from "@/types/live/live";
import type {
  LiveDonationAlertOverlayData,
  LiveDonationAlertOverlaySnapshot,
} from "@/types/live/live-donation-alert-overlay";
import { mapLiveMessageToDonationAlert } from "@/utils/live/live-overlay-message";

import { NeonDonationIcon } from "./neon-donation-icon";

export function LiveDonationAlertOverlay({
  initialSnapshot,
}: {
  initialSnapshot: LiveDonationAlertOverlaySnapshot;
}) {
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

  return (
    <main className="live-overlay-root flex min-h-screen items-center justify-center overflow-hidden bg-transparent p-4 text-white">
      <AnimatePresence mode="wait">
        {donation && isVisible ? (
          <motion.section
            key={donation.id}
            className="pointer-events-none flex w-full justify-center"
            variants={liveDonationAlertContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex min-h-68 w-full max-w-105 flex-col items-center justify-center rounded-xl bg-slate-600/95 px-8 py-6 text-center shadow-2xl">
              <motion.div variants={liveDonationAlertIconVariants} className="-mt-5 -mb-1">
                <NeonDonationIcon className="size-52 drop-shadow-lg" />
              </motion.div>

              <div className="flex flex-col items-center gap-1">
                <motion.div
                  variants={liveDonationAlertTextVariants}
                  className="text-brand flex items-baseline justify-center gap-1.5 text-2xl leading-8 font-extrabold"
                >
                  <span>{donation.donorName}님이</span>
                  <span>{donation.amount.toLocaleString("ko-KR")}P 후원</span>
                </motion.div>
                <motion.p
                  variants={liveDonationAlertTextVariants}
                  className="max-w-88 text-lg leading-6 font-bold text-white"
                >
                  {donation.message}
                </motion.p>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
