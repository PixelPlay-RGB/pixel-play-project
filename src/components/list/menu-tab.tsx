"use client";

import { useState } from "react";
import ChatList from "@/components/list/chat-list";
import LiveList from "@/components/list/live-list";
import { MAX_CAPACITY, MENU_TABS } from "@/constants/menu-tab";
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

export default function MenuTab() {
  const [activeTab, setActiveTab] = useState<"live" | "chat">("chat");

  return (
    <SidebarProvider className="h-[calc(100vh-64px-90px)] min-h-0">
      <Sidebar collapsible="none" className="h-full border-r">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>메뉴</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {MENU_TABS.map(({ key, label, icon: Icon }) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      isActive={activeTab === key}
                      onClick={() => setActiveTab(key)}
                      size="lg"
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
        <div className="p-6 h-full overflow-auto">
          {activeTab === "chat" ? (
            <ChatList maxCapacity={MAX_CAPACITY} />
          ) : (
            <LiveList />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
