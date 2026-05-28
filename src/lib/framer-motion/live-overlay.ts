// 라이브 OBS 오버레이 motion preset을 정의합니다.
import type { Variants } from "motion/react";

export const liveDonationAlertContainerVariants = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.18,
      type: "spring",
      stiffness: 260,
      damping: 16,
    },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.16 } },
} satisfies Variants;

export const liveDonationAlertIconVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.015,
      duration: 0.16,
      type: "spring",
      stiffness: 300,
      damping: 14,
    },
  },
} satisfies Variants;

export const liveDonationAlertTextVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.02,
      duration: 0.18,
    },
  },
} satisfies Variants;
