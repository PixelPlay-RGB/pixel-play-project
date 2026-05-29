// 라이브 Sidebar의 고정 카테고리 항목을 렌더링합니다.

import type { LucideIcon } from "lucide-react";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { LiveListFilter } from "@/types/live/live";

interface LiveSidebarCategoryItemProps {
  icon: LucideIcon;
  label: string;
  value: LiveListFilter;
  isActive: boolean;
  onSelect: (filter: LiveListFilter) => void;
}

export default function LiveSidebarCategoryItem({
  icon: Icon,
  label,
  value,
  isActive,
  onSelect,
}: LiveSidebarCategoryItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        isActive={isActive}
        aria-pressed={isActive}
        onClick={() => onSelect(value)}
      >
        <Icon className={isActive ? "text-live" : "text-muted-foreground"} />
        <span>{label}</span>
        {isActive && <span className="bg-live ml-auto size-1.5 rounded-full" />}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
