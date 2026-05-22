// 랜딩 프리뷰 히어로 비주얼 카드 묶음을 렌더링합니다.
"use client";

import { motion } from "motion/react";

import { HeroBroadcastCard } from "@/components/preview/landing/sections/hero/hero-broadcast-card";
import { HeroChatCard } from "@/components/preview/landing/sections/hero/hero-chat-card";
import { HeroReadyCard } from "@/components/preview/landing/sections/hero/hero-ready-card";

export function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.5, 1, 0.5, 1] }}
      className="relative h-112 w-full sm:h-128 lg:h-144"
    >
      <HeroBroadcastCard />
      <HeroChatCard />
      <HeroReadyCard />
    </motion.div>
  );
}
