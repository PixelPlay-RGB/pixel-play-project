"use client";
// 채널 관리 레이아웃 전체를 감싸는 클라이언트 쉘을 렌더링합니다.

import ChannelSidebar from "@/components/channel/channel-sidebar";
import { SidebarAutoClose } from "@/components/common/sidebar-auto-close";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { ReactNode, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
}

export default function ChannelShell({ children }: Props) {
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
      <SidebarAutoClose />
      <ChannelSidebar isMobile={isMobile} />
      <SidebarInset className="min-w-0 overflow-hidden">
        {isMobile && (
          <div className="border-border flex shrink-0 items-center gap-3 border-b p-4">
            <SidebarTrigger className="cursor-pointer" />
            <span className="text-foreground text-sm font-semibold">채널 관리</span>
          </div>
        )}
        <div className="h-full min-w-0 overflow-auto p-6 md:p-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
