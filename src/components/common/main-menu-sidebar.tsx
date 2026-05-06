"use client";

import { useState } from "react";
import ChatRoomList from "@/components/chat/chat-room-list";
import LiveList from "@/components/live/live-list";
import { MAIN_MENU_SIDEBAR_ITEMS } from "@/constants/main-menu-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { MainMenuSidebarKey } from "@/types/main-menu-sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface Props {
  activeMenu: MainMenuSidebarKey;
  setActiveMenu: (menu: MainMenuSidebarKey) => void;
}

function Items({ activeMenu, setActiveMenu }: Props) {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleMenuChange = (menu: MainMenuSidebarKey) => {
    setActiveMenu(menu);

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu className={"flex-col gap-1.5"}>
      {MAIN_MENU_SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => (
        <SidebarMenuItem key={key}>
          <SidebarMenuButton
            isActive={activeMenu === key}
            onClick={() => handleMenuChange(key)}
            size="lg"
            className="cursor-pointer"
          >
            <Icon />
            <span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export default function MainMenuSidebar() {
  const [activeMenu, setActiveMenu] = useState<MainMenuSidebarKey>("chat");
  const isMobile = useIsMobile();

  return (
    <SidebarProvider
      className={cn("h-[calc(100vh-64px-90px)] min-h-0", "**:data-[slot=sidebar-container]:h-full")}
    >
      <Sidebar collapsible={isMobile ? "offcanvas" : "none"} className="h-full border-r">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>메뉴</SidebarGroupLabel>
            <SidebarGroupContent>
              <Items activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {isMobile && (
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800/50">
            <SidebarTrigger className="cursor-pointer" />
          </div>
        )}
        <div className="h-full overflow-auto p-4 md:p-6">
          {activeMenu === "chat" ? <ChatRoomList /> : <LiveList />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
