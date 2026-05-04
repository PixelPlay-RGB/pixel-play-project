"use client";

import { useState } from "react";
import ChatRoomList from "@/components/chat/chat-room-list";
import LiveList from "@/components/live/live-list";
import { MENU_SIDEBAR_ITEMS } from "@/constants/menu-sidebar";
import { cn } from "@/lib/utils";
import type { MenuSidebarKey } from "@/types/menu-sidebar";
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
} from "@/components/ui/sidebar";

export default function MenuSidebar() {
  const [activeMenu, setActiveMenu] = useState<MenuSidebarKey>("chat");

  return (
    <SidebarProvider className={cn("h-[calc(100vh-64px-90px)]", "min-h-0")}>
      <Sidebar collapsible="none" className="h-full border-r">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>메뉴</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {MENU_SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      isActive={activeMenu === key}
                      onClick={() => setActiveMenu(key)}
                      size="lg"
                      className="cursor-pointer"
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <div className="h-full overflow-auto p-6">
          {activeMenu === "chat" ? <ChatRoomList /> : <LiveList />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
