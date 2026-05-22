// 사용자 계정 메뉴 항목을 컨텍스트별로 렌더링합니다.
import PasswordDialog from "@/components/auth/password/password-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import type { UserAccountMenuItem } from "@/constants/common/user-account-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

export const USER_ACCOUNT_POPOVER_ITEM_CLASS =
  "route-accent-hover h-10 w-full cursor-pointer flex-row justify-start gap-3 rounded-lg px-3 text-sm font-semibold";

export type UserAccountMenuHandlers = {
  context: "popover" | "sidebar";
  onClose?: () => void;
  onLogout?: () => Promise<void>;
  isLogoutPending?: boolean;
  isActive?: (href: string) => boolean;
  isCanChangePassword: boolean;
};

export default function UserAccountMenuItemRenderer(
  item: UserAccountMenuItem,
  handlers: UserAccountMenuHandlers,
): ReactNode {
  const Icon = item.icon;

  switch (item.type) {
    case "link": {
      if (handlers.context === "popover") {
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={handlers.onClose}
            className={cn(buttonVariants({ variant: "ghost" }), USER_ACCOUNT_POPOVER_ITEM_CLASS)}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      }

      const active = handlers.isActive?.(item.href) ?? false;

      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton render={<Link href={item.href} />} isActive={active}>
            <Icon />
            <span>{item.label}</span>
            {active && <span className="bg-brand ml-auto size-1.5 rounded-full" />}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    case "changePassword": {
      if (!handlers.isCanChangePassword) return null;

      if (handlers.context === "popover") {
        return (
          <PasswordDialog
            key={item.id}
            className={USER_ACCOUNT_POPOVER_ITEM_CLASS}
            label={item.label}
            icon={Icon}
          />
        );
      }

      return (
        <SidebarMenuItem key={item.id}>
          <PasswordDialog
            trigger={
              <SidebarMenuButton>
                <Icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            }
          />
        </SidebarMenuItem>
      );
    }

    case "logout": {
      if (handlers.context === "sidebar") return null;

      return (
        <Button
          key={item.id}
          variant="ghost"
          className={cn(USER_ACCOUNT_POPOVER_ITEM_CLASS, "text-muted-foreground")}
          onClick={() => void handlers.onLogout?.()}
          disabled={handlers.isLogoutPending}
        >
          {handlers.isLogoutPending ? <Spinner /> : <Icon className="size-4" />}
          {item.label}
        </Button>
      );
    }
  }
}
