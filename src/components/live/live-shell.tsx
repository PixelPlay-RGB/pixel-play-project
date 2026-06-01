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

  if (!isMounted) {
    return <div className="h-chat-content min-h-0 overflow-auto p-6 md:p-10">{children}</div>;
  }

  return (
    <SidebarProvider className="h-chat-content min-h-0 overflow-hidden">
      <LiveSidebar isMobile={isMobile} />
      <SidebarInset className="min-w-0 overflow-hidden">
        {isMobile && (
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
