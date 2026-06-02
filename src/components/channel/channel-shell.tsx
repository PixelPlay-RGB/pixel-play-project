"use client";
// 채널 관리 레이아웃 전체를 감싸는 클라이언트 쉘을 렌더링합니다.

import ChannelSidebar from "@/components/channel/channel-sidebar";
import { SidebarAutoClose } from "@/components/common/sidebar-auto-close";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
}

export default function ChannelShell({ children }: Props) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const isLiveOperationRoute = pathname === "/channel/live";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // children을 항상 동일한 위치에 두고 사이드바/모바일 헤더만 마운트 후 조건부로 렌더합니다.
  // (루트 트리를 교체하면 children 전체가 재마운트되어 쿼리 중복 실행·로컬 상태 초기화가 발생함)
  return (
    <SidebarProvider className="h-chat-content min-h-0 overflow-hidden">
      <SidebarAutoClose />
      {isMounted && <ChannelSidebar isMobile={isMobile} />}
      <SidebarInset className="min-w-0 overflow-hidden">
        {isMounted && isMobile && (
          <div className="border-border flex shrink-0 items-center gap-3 border-b p-4">
            <SidebarTrigger className="cursor-pointer" />
            <span className="text-foreground text-sm font-semibold">채널 관리</span>
          </div>
        )}
        <div
          className={cn(
            "h-full min-w-0 overflow-auto p-6 md:p-10",
            isLiveOperationRoute && "xl:overflow-hidden",
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
