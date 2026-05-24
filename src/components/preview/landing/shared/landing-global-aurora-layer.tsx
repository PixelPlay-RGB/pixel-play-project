// 랜딩 프리뷰 전체 배경의 스크롤 parallax 레이어를 렌더링합니다.
"use client";

import { motion, useScroll, useTransform } from "motion/react";

import { LandingAuroraBackground } from "@/components/preview/landing/shared/landing-aurora-background";

export function LandingGlobalAuroraLayer() {
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, (latest) => latest * 0.22);

  return (
    <motion.div
      data-landing-global-aurora
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ y: backgroundY }}
      aria-hidden
    >
      <LandingAuroraBackground variant="global" />
    </motion.div>
  );
}
