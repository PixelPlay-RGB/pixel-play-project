"use client";
// 라이브 페이지 레이아웃 전체를 감싸는 클라이언트 쉘을 렌더링합니다.

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import LiveSidebar from "@/components/live/live-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/common/use-mobile";

interface LiveShellProps {
  children: ReactNode;
}

export default function LiveShell({ children }: LiveShellProps) {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // children을 항상 동일한 위치에 두고 사이드바/모바일 헤더만 마운트 후 조건부로 렌더합니다.
  // (루트 트리를 교체하면 children 전체가 재마운트되어 쿼리 중복 실행·로컬 상태 초기화가 발생함)
  return (
    <SidebarProvider className="h-chat-content min-h-0 overflow-hidden">
      {isMounted && <LiveSidebar isMobile={isMobile} />}
      <SidebarInset className="min-w-0 overflow-hidden">
        {isMounted && isMobile && (
          <div className="border-border flex shrink-0 items-center gap-3 border-b p-4">
            <SidebarTrigger className="cursor-pointer" />
            <span className="text-foreground text-sm font-semibold">라이브</span>
          </div>
        )}
        <div className="h-full min-w-0 overflow-auto p-6 md:p-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
