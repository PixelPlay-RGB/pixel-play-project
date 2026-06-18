"use client";
// 헤더 사용자 계정 메뉴를 렌더링합니다.

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import IdentityCard from "@/components/common/identity-card";
import UserAccountMenuItemRenderer from "@/components/common/user-account-menu-item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  createMyChannelMenuItem,
  USER_ACCOUNT_DONATION_MENU_ITEM,
  USER_ACCOUNT_FOLLOWING_MENU_ITEM,
  USER_ACCOUNT_HEADER_ACCOUNT_MENU_ITEMS,
  USER_ACCOUNT_PRIMARY_MENU_ITEMS,
  USER_ACCOUNT_PROFILE_MENU_ITEM,
  USER_ACCOUNT_SUBSCRIPTION_MENU_ITEM,
} from "@/constants/common/user-account-menu";
import type { UserAccountMenuItem } from "@/constants/common/user-account-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import { cn } from "@/lib/utils";
import type { CurrentProfileSnapshot } from "@/types/profile/user";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { useState } from "react";

interface Props {
  profile: CurrentProfileSnapshot;
}

interface AccountMenuGroup {
  label: string;
  items: UserAccountMenuItem[];
}

export default function UserAccountMenu({ profile }: Props) {
  const logoutMutation = useLogout();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync().catch(() => undefined);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  const isCanChangePassword = profile.linked_providers.includes("email");
  const avatarSrc = getAvatarImageSrc(profile.photo_url);
  const avatarAlt = `${profile.nickname}의 프로필 사진`;
  // 설정 사이드바와 동일하게 성격별 섹션으로 나눕니다.
  // 내 채널(채널·채널 관리)을 먼저, 활동(팔로잉·구독·후원)을 아래에 둡니다. 비밀번호 변경·로그아웃은 하단.
  const menuGroups: AccountMenuGroup[] = [
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
  ];

  const renderItem = (item: UserAccountMenuItem) =>
    UserAccountMenuItemRenderer(item, {
      context: "popover",
      onClose: () => setOpen(false),
      onLogout: handleLogout,
      isLogoutPending: logoutMutation.isPending,
      isCanChangePassword,
    });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          "border-border/60 bg-background/80 flex h-9 items-center gap-2 rounded-full border px-2 pr-3",
          "text-foreground text-sm font-bold shadow-sm transition-colors",
          "route-accent-hover dark:bg-card/80",
        )}
        aria-label="프로필 메뉴 열기"
      >
        <span className="relative shrink-0">
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarSrc} alt={avatarAlt} />
            <AvatarFallback>{getAvatarFallbackText(profile.nickname)}</AvatarFallback>
          </Avatar>
        </span>
        <span className="hidden max-w-20 truncate sm:inline">{profile.nickname}</span>
      </PopoverTrigger>

      <PopoverContent className="w-72 overflow-hidden p-2" align="end" sideOffset={8}>
        <IdentityCard
          href={USER_ACCOUNT_PROFILE_MENU_ITEM.href}
          onClick={() => setOpen(false)}
          avatarSrc={avatarSrc}
          avatarAlt={avatarAlt}
          fallbackText={getAvatarFallbackText(profile.nickname)}
          badgeLabel={USER_ACCOUNT_PROFILE_MENU_ITEM.label}
          title={profile.nickname}
        />

        <Separator className="my-2" />

        <div className="flex flex-col gap-2.5">
          {menuGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="text-muted-foreground text-2xs px-2 font-semibold">{group.label}</p>
              <div className="flex flex-col gap-1">{group.items.map(renderItem)}</div>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-1">
          {USER_ACCOUNT_HEADER_ACCOUNT_MENU_ITEMS.map(renderItem)}
        </div>
      </PopoverContent>
    </Popover>
  );
}
