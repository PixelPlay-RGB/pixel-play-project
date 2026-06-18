"use client";
// setting-sidebar 컴포넌트를 제공합니다.

import IdentityCard from "@/components/common/identity-card";
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
  createMyChannelMenuItem,
  USER_ACCOUNT_DONATION_MENU_ITEM,
  USER_ACCOUNT_FOLLOWING_MENU_ITEM,
  USER_ACCOUNT_PASSWORD_MENU_ITEM,
  USER_ACCOUNT_PRIMARY_MENU_ITEMS,
  USER_ACCOUNT_PROFILE_MENU_ITEM,
  USER_ACCOUNT_SUBSCRIPTION_MENU_ITEM,
} from "@/constants/common/user-account-menu";
import type { UserAccountMenuItem } from "@/constants/common/user-account-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import type { CurrentProfileSnapshot } from "@/types/profile/user";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  isMobile?: boolean;
  profile: CurrentProfileSnapshot | null;
}

interface SettingMenuGroup {
  label: string;
  items: UserAccountMenuItem[];
}

export default function SettingSidebar({ isMobile, profile }: Props) {
  const pathname = usePathname();
  const logoutMutation = useLogout();

  const isCanChangePassword = profile?.linked_providers.includes("email") ?? false;

  // 프로필 설정은 상단 UserCard가 대신하므로 메뉴에서 제외하고, 성격별 섹션으로 나눕니다.
  // 내 채널(채널·채널 관리)을 먼저, 활동(팔로잉·구독·후원)을 아래에 둡니다. 비밀번호 변경·로그아웃은 Footer.
  const menuGroups: SettingMenuGroup[] = profile
    ? [
        {
          label: "내 채널",
          items: [createMyChannelMenuItem(profile.id), ...USER_ACCOUNT_PRIMARY_MENU_ITEMS],
        },
        {
          label: "활동",
          items: [
            USER_ACCOUNT_FOLLOWING_MENU_ITEM,
            USER_ACCOUNT_SUBSCRIPTION_MENU_ITEM,
            USER_ACCOUNT_DONATION_MENU_ITEM,
          ],
        },
      ]
    : [
        {
          label: "활동",
          items: [
            USER_ACCOUNT_FOLLOWING_MENU_ITEM,
            USER_ACCOUNT_SUBSCRIPTION_MENU_ITEM,
            USER_ACCOUNT_DONATION_MENU_ITEM,
          ],
        },
      ];

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
              href={USER_ACCOUNT_PROFILE_MENU_ITEM.href}
              avatarSrc={getAvatarImageSrc(profile.photo_url)}
              avatarAlt={`${profile.nickname}의 프로필 사진`}
              fallbackText={getAvatarFallbackText(profile.nickname)}
              badgeLabel={USER_ACCOUNT_PROFILE_MENU_ITEM.label}
              title={profile.nickname}
            />
          </div>
        )}

        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) =>
                  UserAccountMenuItemRenderer(item, {
                    context: "sidebar",
                    isActive: (href) => pathname === href,
                    isCanChangePassword,
                  }),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
