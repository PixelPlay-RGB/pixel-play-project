// setting-menu-item 컴포넌트를 제공합니다.
import PasswordDialog from "@/components/auth/password/password-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { SettingMenuItem } from "@/types/setting/setting-menu";
import type { SettingMenuHandlers } from "@/types/setting/setting-menu";
import Link from "next/link";
import { ReactNode } from "react";

const POPOVER_ITEM_CLASS = "cursor-pointer w-full flex-row justify-start gap-5";

export default function SettingMenuItemRenderer(
  item: SettingMenuItem,
  handlers: SettingMenuHandlers,
  isCanChangePassword: boolean,
): ReactNode {
  const { onClose, onLogout, isLogoutPending = false, actions, isActive } = handlers;
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
          <Button
            key={item.id}
            variant="ghost"
            className={POPOVER_ITEM_CLASS}
            onClick={() => void onLogout()}
            disabled={isLogoutPending}
          >
            {isLogoutPending ? <Spinner /> : Icon && <Icon />}
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
            {active && <span className="bg-brand ml-auto size-1.5 rounded-full" />}
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
          <SidebarMenuButton onClick={() => void onLogout()} disabled={isLogoutPending}>
            {isLogoutPending ? <Spinner /> : Icon && <Icon />}
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
