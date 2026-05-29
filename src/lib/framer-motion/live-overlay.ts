// 라이브 OBS 오버레이 motion preset을 정의합니다.
import type { Variants } from "motion/react";

export const liveDonationAlertContainerVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      type: "spring",
      stiffness: 120,
      damping: 10,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
} satisfies Variants;

export const liveDonationAlertIconVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 8,
    },
  },
} satisfies Variants;

export const liveDonationAlertTextVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
    },
  },
} satisfies Variants;
