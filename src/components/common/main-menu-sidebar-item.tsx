import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { MainMenuSidebarItem, MainMenuSidebarKey } from "@/types/main-menu-sidebar";
import type { ReactNode } from "react";

interface Handlers {
  activeMenu: MainMenuSidebarKey;
  onMenuChange: (menu: MainMenuSidebarKey) => void;
}

export default function MainMenuSidebarItemRenderer(
  item: MainMenuSidebarItem,
  handlers: Handlers,
): ReactNode {
  const { activeMenu, onMenuChange } = handlers;
  const { key, label, icon: Icon } = item;
  const isActive = activeMenu === key;

  return (
    <SidebarMenuItem key={key}>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => onMenuChange(key)}
        size="lg"
        className={cn(
          "h-auto cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
          "data-active:bg-brand/10 data-active:text-brand data-active:hover:bg-brand/10 data-active:hover:text-brand",
          "dark:data-active:bg-brand/15",
          isActive
            ? "bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand dark:bg-brand/15"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            isActive ? "text-brand" : "text-zinc-400 dark:text-zinc-500",
          )}
        />
        <span className={cn(isActive && "text-brand")}>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
