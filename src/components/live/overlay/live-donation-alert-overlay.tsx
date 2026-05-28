"use client";
// OBS 브라우저 소스에 붙이는 후원 알림 화면을 렌더링합니다.
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { LIVE_DONATION_ALERT_VISIBLE_MS } from "@/constants/live/live-overlay";
import { cn } from "@/lib/utils/cn";
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

import { PixelPlayPlayIcon } from "./pixel-play-play-icon";

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

  const donorLabel = formatDonationDonorLabel(donation?.donorName);
  const formattedAmount = donation?.amount.toLocaleString("ko-KR");

  return (
    <main className="live-overlay-root flex min-h-screen items-center justify-center overflow-hidden bg-transparent p-4 text-white">
      <AnimatePresence mode="wait">
        {donation && isVisible ? (
          <motion.section
            key={donation.id}
            className="pointer-events-none flex aspect-video w-full max-w-144 items-center justify-center"
            variants={liveDonationAlertContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className={cn(
                "flex w-full max-w-132 items-center justify-center overflow-hidden",
                "border-brand/25 rounded-xl border bg-zinc-950/95 shadow-2xl",
                "px-5 py-5 sm:px-8 sm:py-6",
              )}
            >
              <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <div className="relative flex size-20 shrink-0 items-center justify-center sm:size-24">
                  <motion.div
                    className="bg-brand/25 absolute inset-1 rounded-full blur-xl"
                    animate={{
                      scale: [1, 1.35, 1],
                      opacity: [0.3, 0.12, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  <motion.div
                    variants={liveDonationAlertIconVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative z-10"
                  >
                    <PixelPlayPlayIcon className="text-brand size-14 drop-shadow-lg sm:size-16" />
                  </motion.div>
                </div>

                <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                  <motion.span
                    variants={liveDonationAlertTextVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-brand text-4xl leading-none font-extrabold sm:text-5xl"
                  >
                    {formattedAmount}P
                  </motion.span>
                  <motion.p
                    variants={liveDonationAlertTextVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-brand/85 max-w-full text-lg leading-6 font-bold break-words sm:text-xl"
                  >
                    {donorLabel}의 후원
                  </motion.p>
                  <motion.p
                    variants={liveDonationAlertTextVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-88 text-base leading-6 font-semibold break-words text-zinc-200 sm:max-w-96 sm:text-lg"
                  >
                    {donation.message}
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function formatDonationDonorLabel(donorName: string | undefined) {
  if (!donorName) {
    return "시청자님";
  }

  return donorName.endsWith("님") ? donorName : `${donorName}님`;
}
