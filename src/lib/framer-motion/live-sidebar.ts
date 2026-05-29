// 라이브 Sidebar 접힘 전환 애니메이션 preset
import type { Variants } from "motion/react";

export const liveSidebarSectionContentVariants: Variants = {
  closed: {
    height: 0,
    opacity: 0,
  },
  open: {
    height: "auto",
    opacity: 1,
  },
};

export const liveSidebarSectionContentTransition = {
  duration: 0.18,
  ease: "easeOut",
} as const;
