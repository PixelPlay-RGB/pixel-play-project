// 라이브 Sidebar의 고정 카테고리 항목을 렌더링합니다.

import type { LucideIcon } from "lucide-react";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface LiveSidebarCategoryItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}

export default function LiveSidebarCategoryItem({
  icon: Icon,
  label,
  isActive,
}: LiveSidebarCategoryItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<div />} isActive={isActive} className="cursor-default">
        <Icon className={isActive ? "text-live" : "text-muted-foreground"} />
        <span>{label}</span>
        {isActive && <span className="bg-live ml-auto size-1.5 rounded-full" />}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
