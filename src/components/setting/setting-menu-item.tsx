import PasswordDialog from "@/components/auth/password/password-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { SettingMenuItem } from "@/types/setting-menu";
import Link from "next/link";
import { ReactNode } from "react";

export type SettingMenuHandlers = {
  onClose?: () => void; // Popover 컨텍스트에서 사용 (있으면 Popover 스타일, 없으면 Sidebar 스타일)
  onLogout: () => Promise<void>;
  isActive?: (href: string) => boolean;
  actions?: Record<string, () => void | Promise<void>>;
};

const POPOVER_ITEM_CLASS = "cursor-pointer w-full flex-row justify-start gap-5";

export default function SettingMenuItemRenderer(
  item: SettingMenuItem,
  handlers: SettingMenuHandlers,
  isCanChangePassword: boolean,
): ReactNode {
  const { onClose, onLogout, actions, isActive } = handlers;
  const Icon = item.icon;

  if (onClose !== undefined) {
    // Popover 컨텍스트: SidebarMenuButton은 useSidebar() 필수라 사용 불가
    if (item.sidebarOnly) return null;
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
      case "changePassword":
        return (
          isCanChangePassword && (
            <PasswordDialog
              key={item.id}
              className={POPOVER_ITEM_CLASS}
              label={item.label}
              icon={Icon}
            />
          )
        );
    }
  }

  // Sidebar 컨텍스트
  switch (item.type) {
    case "link": {
      const active = isActive?.(item.href) ?? false;
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton render={<Link href={item.href} />} isActive={active}>
            {Icon && <Icon />}
            <span>{item.label}</span>
            {active && <span className="ml-auto size-1.5 rounded-full bg-brand" />}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }
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
    case "changePassword":
      return (
        isCanChangePassword && (
          <SidebarMenuItem key={item.id}>
            <PasswordDialog
              trigger={
                <SidebarMenuButton>
                  {Icon && <Icon />}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        )
      );
  }
}
