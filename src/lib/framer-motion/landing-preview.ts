// 랜딩 프리뷰 motion 설정을 관리합니다.
import type { RevealDirection } from "@/types/preview/landing-preview";
import type { Variants } from "motion/react";

export const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

export const SECTION_REVEAL_HIDDEN_STATE = {
  left: { opacity: 0, x: -50 },
  right: { opacity: 0, x: 50 },
  up: { opacity: 0, y: 40 },
  scale: { opacity: 0, scale: 0.92 },
} as const satisfies Record<RevealDirection, object>;

export const SECTION_REVEAL_VISIBLE_STATE = {
  left: { opacity: 1, x: 0 },
  right: { opacity: 1, x: 0 },
  up: { opacity: 1, y: 0 },
  scale: { opacity: 1, scale: 1 },
} as const satisfies Record<RevealDirection, object>;

export const CHAT_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

export const TUTORIAL_STEP_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: REVEAL_EASE },
  }),
};
