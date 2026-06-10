"use client";
// 라이브 페이지 레이아웃 전체를 감싸는 클라이언트 쉘을 렌더링합니다.

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import LiveSidebar from "@/components/live/live-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/common/use-mobile";
import {
  liveSidebarCollapseTransition,
  liveSidebarCollapseVariants,
} from "@/lib/framer-motion/live-sidebar";
import { cn } from "@/lib/utils";
import { useLiveTheaterStore } from "@/stores/live-theater";

interface LiveShellProps {
  children: ReactNode;
  // 콘텐츠 래퍼 클래스. 목록은 패딩+스크롤, 시청 화면은 풀블리드로 직접 지정한다.
  contentClassName?: string;
  // 모바일 상단 헤더에 표시할 라벨(기본 "라이브"). 채널 등 다른 화면에서 재사용 시 지정.
  mobileTitle?: string;
}

export default function LiveShell({
  children,
  contentClassName = "overflow-auto p-6 md:p-10",
  mobileTitle = "라이브",
}: LiveShellProps) {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);
  // 와이드(극장) 모드 진입 시 데스크탑 전역 사이드바를 접는다(시청 화면에서만 true가 됨).
  const isWideMode = useLiveTheaterStore((state) => state.isWideMode);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // children을 항상 동일한 위치에 두고 사이드바/모바일 헤더만 마운트 후 조건부로 렌더합니다.
  // (루트 트리를 교체하면 children 전체가 재마운트되어 쿼리 중복 실행·로컬 상태 초기화가 발생함)
  return (
    <SidebarProvider className="h-chat-content min-h-0 overflow-hidden">
      {/* 모바일 사이드바는 Sheet(오프캔버스)라 레이아웃 폭을 차지하지 않으므로 래퍼 없이 그대로 둔다. */}
      {isMounted && isMobile && <LiveSidebar isMobile />}
      {/*
        데스크탑 사이드바는 SSR에 포함하고 모바일에선 CSS(hidden md:block)로 숨긴다.
        isMounted 가드로 마운트 후에 끼워 넣으면 첫 페인트 뒤 콘텐츠 전체가 밀려
        모든 페이지에 공통 CLS(~0.18)가 생긴다. collapsible="none"(고정폭)이라
        내장 collapse가 없어, 와이드 모드에서 motion으로 폭을 접어 시청 영역을 넓힌다.
      */}
      <motion.div
        className={cn(
          "hidden h-full shrink-0 overflow-hidden md:block",
          isWideMode && "pointer-events-none",
        )}
        // 접힘은 폭/투명도만 줄이므로 내부 링크가 Tab 포커스·AT 트리에 남는다 → 상호작용도 함께 차단.
        aria-hidden={isWideMode || undefined}
        inert={isWideMode || undefined}
        initial={false}
        animate={isWideMode ? "collapsed" : "expanded"}
        variants={liveSidebarCollapseVariants}
        transition={prefersReducedMotion ? { duration: 0 } : liveSidebarCollapseTransition}
      >
        <LiveSidebar isMobile={false} />
      </motion.div>
      <SidebarInset className="min-w-0 overflow-hidden">
        {/* 모바일 헤더도 같은 이유로 SSR에 포함하고 데스크탑에선 CSS로 숨긴다. */}
        <div className="border-border flex shrink-0 items-center gap-3 border-b p-4 md:hidden">
          <SidebarTrigger className="cursor-pointer" />
          <span className="text-foreground text-sm font-semibold">{mobileTitle}</span>
        </div>
        <div className={cn("h-full min-w-0", contentClassName)}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
