"use client";
// setting-sidebar 컴포넌트를 제공합니다.

import UserAccountMenuItemRenderer from "@/components/common/user-account-menu-item";
import { SidebarCredits } from "@/components/common/sidebar-credits";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  USER_ACCOUNT_PASSWORD_MENU_ITEM,
  USER_ACCOUNT_SIDEBAR_MENU_ITEMS,
} from "@/constants/common/user-account-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import type { CurrentProfileSnapshot } from "@/types/profile/user";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  isMobile?: boolean;
  profile: CurrentProfileSnapshot | null;
}

export default function SettingSidebar({ isMobile, profile }: Props) {
  const pathname = usePathname();
  const logoutMutation = useLogout();

  const isCanChangePassword = profile?.linked_providers.includes("email") ?? false;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync().catch(() => undefined);
  };

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="bg-background h-full shrink-0 border-r"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>설정</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={"gap-1.5"}>
              {USER_ACCOUNT_SIDEBAR_MENU_ITEMS.map((item) =>
                UserAccountMenuItemRenderer(item, {
                  context: "sidebar",
                  isActive: (href) => pathname === href,
                  isCanChangePassword,
                }),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-0 p-0">
        <Separator />
        <div className="px-2 py-2">
          <SidebarMenu className="gap-1.5">
            {UserAccountMenuItemRenderer(USER_ACCOUNT_PASSWORD_MENU_ITEM, {
              context: "sidebar",
              isCanChangePassword,
            })}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => void handleLogout()}
                disabled={logoutMutation.isPending}
                className="text-muted-foreground"
              >
                {logoutMutation.isPending ? <Spinner /> : <LogOut />}
                <span>로그아웃</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        <SidebarCredits />
      </SidebarFooter>
    </Sidebar>
  );
}
