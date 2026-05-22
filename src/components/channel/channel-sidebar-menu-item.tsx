// 채널 관리 사이드바 메뉴 항목을 렌더링합니다.
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { ChannelMenuItem } from "@/types/channel/channel-menu";
import Link from "next/link";

interface Props {
  item: ChannelMenuItem;
  isActive: boolean;
}

export default function ChannelSidebarMenuItem({ item, isActive }: Props) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive}>
        <Icon />
        <span>{item.label}</span>
        {isActive && <span className="bg-brand ml-auto size-1.5 rounded-full" />}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
