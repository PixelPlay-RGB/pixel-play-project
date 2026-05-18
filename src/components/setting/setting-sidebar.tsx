"use client";

import SettingMenuItem from "@/components/setting/setting-menu-item";
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
import { SETTING_MENU } from "@/constants/setting-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import type { CurrentProfileSnapshot } from "@/utils/profile-server";
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

  const mainItems = SETTING_MENU.filter((item) => item.type !== "logout");

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
              {mainItems.map((item) =>
                SettingMenuItem(
                  item,
                  {
                    onLogout: handleLogout,
                    isLogoutPending: logoutMutation.isPending,
                    isActive: (href) => pathname === href,
                  },
                  isCanChangePassword,
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <Separator />
        <div className="p-2">
          <SidebarMenu>
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
      </SidebarFooter>
    </Sidebar>
  );
}
