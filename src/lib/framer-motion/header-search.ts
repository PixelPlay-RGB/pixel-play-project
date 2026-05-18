// 헤더 모바일 검색 전환 애니메이션 preset
import type { Variants } from "motion/react";

export const mobileHeaderSearchVariants: Variants = {
  closed: {
    opacity: 0,
    y: -8,
    scale: 0.98,
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

export const mobileHeaderSearchTransition = {
  duration: 0.16,
  ease: "easeOut",
} as const;
