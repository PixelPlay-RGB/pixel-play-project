"use client";
// 채널 관리 사이드바를 렌더링합니다.

import ChannelSidebarMenuItem from "@/components/channel/channel-sidebar-menu-item";
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
import UserAccountMenuItemRenderer from "@/components/common/user-account-menu-item";
import { SidebarCredits } from "@/components/common/sidebar-credits";
import { CHANNEL_MENU_ITEMS } from "@/constants/channel/channel-menu";
import { USER_ACCOUNT_PROFILE_MENU_ITEM } from "@/constants/common/user-account-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  isMobile?: boolean;
}

export default function ChannelSidebar({ isMobile }: Props) {
  const pathname = usePathname();
  const logoutMutation = useLogout();

  const isActive = (href: string) => {
    return pathname === href || (href !== "/channel" && pathname.startsWith(`${href}/`));
  };

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
          <SidebarGroupLabel>채널 관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {CHANNEL_MENU_ITEMS.map((item) => (
                <ChannelSidebarMenuItem key={item.id} item={item} isActive={isActive(item.href)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-0 p-0">
        <Separator />
        <div className="px-2 py-2">
          <SidebarMenu className="gap-1.5">
            {UserAccountMenuItemRenderer(USER_ACCOUNT_PROFILE_MENU_ITEM, {
              context: "sidebar",
              isActive: (href) => pathname === href,
              isCanChangePassword: false,
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
