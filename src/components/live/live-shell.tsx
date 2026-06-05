"use client";
// 라이브 페이지 레이아웃 전체를 감싸는 클라이언트 쉘을 렌더링합니다.

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import LiveSidebar from "@/components/live/live-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { cn } from "@/lib/utils";

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
            <span className="text-foreground text-sm font-semibold">{mobileTitle}</span>
          </div>
        )}
        <div className={cn("h-full min-w-0", contentClassName)}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
