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
import IdentityCard from "@/components/common/identity-card";
import { CHANNEL_MENU_GROUPS } from "@/constants/channel/channel-menu";
import type { ChannelMenuItem } from "@/types/channel/channel-menu";
import { USER_ACCOUNT_PROFILE_MENU_ITEM } from "@/constants/common/user-account-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import type { CurrentProfileSnapshot } from "@/types/profile/user";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  isMobile?: boolean;
  profile: CurrentProfileSnapshot | null;
}

export default function ChannelSidebar({ isMobile, profile }: Props) {
  const pathname = usePathname();
  const logoutMutation = useLogout();

  const isActive = (href: string) => {
    return pathname === href || (href !== "/channel" && pathname.startsWith(`${href}/`));
  };

  const isItemActive = (item: ChannelMenuItem) => {
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => isActive(child.href));
    }
    return item.href ? isActive(item.href) : false;
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
        {profile && (
          <div className="px-2 pt-2">
            <IdentityCard
              href={`/channel/${profile.id}`}
              avatarSrc={getAvatarImageSrc(profile.photo_url)}
              avatarAlt={`${profile.nickname}의 채널`}
              fallbackText={getAvatarFallbackText(profile.nickname)}
              badgeLabel="내 채널"
              title={profile.nickname}
            />
          </div>
        )}
        {CHANNEL_MENU_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => (
                  <ChannelSidebarMenuItem
                    key={item.id}
                    item={item}
                    isActive={isItemActive(item)}
                    isChildActive={isActive}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
