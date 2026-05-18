// 채팅방 Presence badge 애니메이션 preset을 정의합니다.
import type { Transition, Variants } from "motion/react";

export const chatRoomPresenceBadgeVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
  },
};

export const chatRoomPresenceBadgeTransition: Transition = {
  duration: 0.16,
  ease: "easeOut",
};

export const chatRoomTypingDotAnimation = {
  opacity: [0.35, 1, 0.35],
  y: [0, -1, 0],
};

export const chatRoomTypingDotTransition: Transition = {
  duration: 0.9,
  ease: "easeInOut",
  repeat: Infinity,
};

export const chatRoomTypingDotDelays = [0, 0.14, 0.28] as const;
