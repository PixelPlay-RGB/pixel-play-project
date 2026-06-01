"use client";
// OBS 후원 알림 오버레이(LiveDonationAlertOverlay)와 동일한 모습/비율(16:9)의 미리보기를 렌더링합니다.

import { motion } from "motion/react";

import { PixelPlayPlayIcon } from "@/components/live/overlay/pixel-play-play-icon";
import { DONATION_TEST_ALERT_SAMPLE } from "@/constants/channel/donation";

interface Props {
  amountVisible: boolean;
}

export default function DonationAlertPreview({ amountVisible }: Props) {
  const { donorNickname, amount, message } = DONATION_TEST_ALERT_SAMPLE;
  const formattedAmount = amount.toLocaleString("ko-KR");

  return (
    <div className="border-live/20 relative flex aspect-video w-full items-center overflow-hidden rounded-2xl border bg-zinc-950 shadow-xl">
      {/* 라이브 컬러 글로우 (좌측 배경) */}
      <div
        className="bg-live/25 absolute top-1/2 -left-12 size-64 -translate-y-1/2 rounded-full blur-3xl"
        aria-hidden
      />
      <div className="relative flex w-full items-center gap-6 px-8 sm:gap-9 sm:px-12">
        <div className="relative flex size-20 shrink-0 items-center justify-center sm:size-28">
          {/* 펄스 후광 (실제 오버레이와 동일하게 동적으로) */}
          <motion.span
            className="bg-live/45 absolute inset-1 rounded-full blur-xl"
            animate={{ scale: [1, 1.4, 1], opacity: [0.55, 0.25, 0.55] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <PixelPlayPlayIcon className="text-live relative z-10 size-16 drop-shadow-[0_0_16px_rgba(255,96,87,0.6)] sm:size-24" />
        </div>

        <div className="flex min-w-0 flex-col gap-2 text-left">
          {amountVisible && (
            <span className="text-live text-4xl leading-none font-black tabular-nums sm:text-6xl">
              {formattedAmount}P
            </span>
          )}
          <span className="text-lg font-bold text-zinc-100 sm:text-2xl">
            <span className="text-live">{donorNickname}님</span>의 후원
          </span>
          <p className="line-clamp-2 text-sm leading-6 font-semibold text-zinc-200 sm:text-lg">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
