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
    <main
      className={cn(
        "live-overlay-root flex min-h-screen items-center justify-center overflow-hidden",
        "bg-transparent p-4 text-white",
      )}
    >
      <AnimatePresence mode="wait">
        {donation && isVisible ? (
          <motion.section
            key={donation.id}
            className="pointer-events-none flex aspect-video w-full max-w-220 items-center justify-center"
            variants={liveDonationAlertContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className={cn(
                "flex w-full max-w-200 items-center justify-center overflow-hidden",
                "border-live/25 rounded-xl border bg-zinc-950/95 shadow-2xl",
                "px-6 py-7 sm:px-12 sm:py-10",
              )}
            >
              <div className="flex w-full flex-col items-center justify-center gap-5 sm:flex-row sm:gap-10">
                <div className="relative flex size-24 shrink-0 items-center justify-center sm:size-32">
                  <motion.div
                    className="bg-live/45 absolute inset-1 rounded-full blur-xl"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.55, 0.25, 0.55],
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
                    <PixelPlayPlayIcon className="text-live size-18 drop-shadow-[0_0_16px_rgba(255,96,87,0.6)] sm:size-24" />
                  </motion.div>
                </div>

                <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                  <motion.span
                    variants={liveDonationAlertTextVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-live text-5xl leading-none font-extrabold sm:text-7xl"
                  >
                    {formattedAmount}P
                  </motion.span>
                  <motion.p
                    variants={liveDonationAlertTextVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-full text-2xl leading-8 font-bold wrap-break-word text-zinc-100 sm:text-3xl sm:leading-9"
                  >
                    <span className="text-live">{donorLabel}</span>의 후원
                  </motion.p>
                  <motion.p
                    variants={liveDonationAlertTextVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-112 text-xl leading-7 font-semibold wrap-break-word text-zinc-200 sm:max-w-120 sm:text-2xl sm:leading-8"
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
