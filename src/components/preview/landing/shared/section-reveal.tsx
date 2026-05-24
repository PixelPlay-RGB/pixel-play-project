// 랜딩 프리뷰 섹션 진입 애니메이션을 적용합니다.

import { motion } from "motion/react";
import type { ReactNode } from "react";

import {
  REVEAL_EASE,
  SECTION_REVEAL_HIDDEN_STATE,
  SECTION_REVEAL_VISIBLE_STATE,
} from "@/lib/framer-motion/landing-preview";
import type { RevealDirection } from "@/types/preview/landing-preview";

export function SectionReveal({
  direction,
  children,
  className,
}: {
  direction: RevealDirection;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={SECTION_REVEAL_HIDDEN_STATE[direction]}
      whileInView={SECTION_REVEAL_VISIBLE_STATE[direction]}
      viewport={{ once: false, amount: 0.35 }}
      transition={{ duration: 0.9, ease: REVEAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
