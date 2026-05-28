"use client";
// OBS 브라우저 소스에 붙이는 후원 알림 화면을 렌더링합니다.
import { AnimatePresence, motion } from "motion/react";

import { useLiveDonationAlertOverlay } from "@/hooks/live/use-live-donation-alert-overlay";
import { cn } from "@/lib/utils";
import {
  liveDonationAlertContainerVariants,
  liveDonationAlertIconVariants,
  liveDonationAlertTextVariants,
} from "@/lib/framer-motion/live-overlay";
import type { LiveDonationAlertOverlaySnapshot } from "@/types/live/live-donation-alert-overlay";
import { formatDonationDonorLabel } from "@/utils/live/live-donation-alert-format";

import { PixelPlayPlayIcon } from "./pixel-play-play-icon";

export function LiveDonationAlertOverlay({
  initialSnapshot,
}: {
  initialSnapshot: LiveDonationAlertOverlaySnapshot;
}) {
  const { donation, isVisible } = useLiveDonationAlertOverlay(initialSnapshot);
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
