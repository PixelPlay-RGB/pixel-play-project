"use client";
// 채널 관리 사이드바를 렌더링합니다.

import ChannelSidebarMenuItem from "@/components/channel/channel-sidebar-menu-item";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { CHANNEL_MENU_ITEMS } from "@/constants/channel/channel-menu";
import { usePathname } from "next/navigation";

interface Props {
  isMobile?: boolean;
}

export default function ChannelSidebar({ isMobile }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || (href !== "/channel" && pathname.startsWith(`${href}/`));
  };

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="bg-background h-full shrink-0 border-r"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>채널 관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {CHANNEL_MENU_ITEMS.map((item) => (
                <ChannelSidebarMenuItem key={item.id} item={item} isActive={isActive(item.href)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
