"use client";
// 채널 관리 사이드바 메뉴 항목(단일 링크 또는 하위 메뉴 아코디언)을 렌더링합니다.
import ChannelSidebarMenuGroup from "@/components/channel/channel-sidebar-menu-group";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { ChannelMenuItem } from "@/types/channel/channel-menu";
import Link from "next/link";

interface Props {
  item: ChannelMenuItem;
  isActive: boolean;
  isChildActive: (href: string) => boolean;
}

export default function ChannelSidebarMenuItem({ item, isActive, isChildActive }: Props) {
  const Icon = item.icon;

  if (item.children && item.children.length > 0) {
    return (
      <ChannelSidebarMenuGroup item={item} isActive={isActive} isChildActive={isChildActive} />
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={item.href ?? "#"} />} isActive={isActive}>
        <Icon />
        <span>{item.label}</span>
        {isActive && <span className="bg-brand ml-auto size-1.5 rounded-full" />}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
