import { Button, buttonVariants } from "@/components/ui/button";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { SettingMenuItem } from "@/types/setting-menu";
import Link from "next/link";
import { ReactNode } from "react";

export type SettingMenuHandlers = {
  onClose?: () => void; // Popover 컨텍스트에서 사용 (있으면 Popover 스타일, 없으면 Sidebar 스타일)
  onLogout: () => Promise<void>;
  // { id: "my-action", type: "action" } 아이템 → actions: { "my-action": handler }
  actions?: Record<string, () => void | Promise<void>>;
};

const POPOVER_ITEM_CLASS = "cursor-pointer w-full flex-row justify-start gap-5";

export default function SettingMenuItemRenderer(
  item: SettingMenuItem,
  handlers: SettingMenuHandlers,
): ReactNode {
  const { onClose, onLogout, actions } = handlers;
  const Icon = item.icon;

  if (onClose !== undefined) {
    // Popover 컨텍스트: SidebarMenuButton은 useSidebar() 필수라 사용 불가
    switch (item.type) {
      case "link":
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onClose}
            className={cn(buttonVariants({ variant: "ghost" }), POPOVER_ITEM_CLASS)}
          >
            {Icon && <Icon />}
            {item.label}
          </Link>
        );
      case "action":
        return (
          <Button
            key={item.id}
            variant="ghost"
            className={POPOVER_ITEM_CLASS}
            onClick={actions?.[item.id]}
          >
            {Icon && <Icon />}
            {item.label}
          </Button>
        );
      case "logout":
        return (
          <Button key={item.id} variant="ghost" className={POPOVER_ITEM_CLASS} onClick={onLogout}>
            {Icon && <Icon />}
            {item.label}
          </Button>
        );
    }
  }

  // Sidebar 컨텍스트
  switch (item.type) {
    case "link":
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton render={<Link href={item.href} />}>
            {Icon && <Icon />}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    case "action":
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton onClick={actions?.[item.id]}>
            {Icon && <Icon />}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    case "logout":
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton onClick={onLogout}>
            {Icon && <Icon />}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
  }
}
