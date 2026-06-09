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

// 와이드(극장) 모드 진입 시 라이브 사이드바 전체를 좌측으로 접는 전환 preset.
// 폭 값은 ui/sidebar의 SIDEBAR_WIDTH("16rem")와 동일해야 하며, 변경 시 함께 맞춘다.
export const liveSidebarCollapseVariants: Variants = {
  expanded: {
    width: "16rem",
    opacity: 1,
  },
  collapsed: {
    width: 0,
    opacity: 0,
  },
};

export const liveSidebarCollapseTransition = {
  duration: 0.2,
  ease: "easeOut",
} as const;
