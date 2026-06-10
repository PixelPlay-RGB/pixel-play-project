// 라이브 Sidebar 접힘 전환 애니메이션 preset
// ⚠️ ui/sidebar는 "use client" 모듈 — 이 파일은 클라이언트 컴포넌트에서만 import할 것.
import { SIDEBAR_WIDTH } from "@/components/ui/sidebar";
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
export const liveSidebarCollapseVariants: Variants = {
  expanded: {
    width: SIDEBAR_WIDTH,
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
