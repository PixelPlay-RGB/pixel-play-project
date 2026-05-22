// 랜딩 프리뷰 히어로 소개 영역의 진입 애니메이션을 담당합니다.
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function HeroIntroMotion({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.5, 1, 0.5, 1] }}
      className="flex flex-col"
    >
      {children}
    </motion.div>
  );
}
