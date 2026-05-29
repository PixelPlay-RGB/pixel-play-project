// 라이브 Sidebar의 고정 카테고리 항목을 렌더링합니다.

import type { LucideIcon } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { LiveListFilter } from "@/types/live/live";

interface LiveSidebarCategoryItemProps {
  icon: LucideIcon;
  label: string;
  value: LiveListFilter;
  isActive: boolean;
  isLoading?: boolean;
  onSelect: (filter: LiveListFilter) => void;
}

export default function LiveSidebarCategoryItem({
  icon: Icon,
  label,
  value,
  isActive,
  isLoading = false,
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
        {isActive ? (
          isLoading ? (
            <Spinner className="text-live ml-auto size-3" />
          ) : (
            <span className="bg-live ml-auto size-1.5 rounded-full" />
          )
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
