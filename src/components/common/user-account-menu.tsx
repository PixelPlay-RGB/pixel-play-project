"use client";
// 헤더 사용자 계정 메뉴를 렌더링합니다.

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserAccountMenuItemRenderer from "@/components/common/user-account-menu-item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  createMyChannelMenuItem,
  USER_ACCOUNT_HEADER_ACCOUNT_MENU_ITEMS,
  USER_ACCOUNT_HEADER_PRIMARY_MENU_ITEMS,
  USER_ACCOUNT_PROFILE_MENU_ITEM,
} from "@/constants/common/user-account-menu";
import type { UserAccountMenuItem } from "@/constants/common/user-account-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import { cn } from "@/lib/utils";
import type { CurrentProfileSnapshot } from "@/types/profile/user";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import Link from "next/link";
import { useState } from "react";

interface Props {
  profile: CurrentProfileSnapshot;
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
  // "내 채널"을 "채널 관리" 위에 노출합니다.
  const primaryMenuItems: UserAccountMenuItem[] = [
    createMyChannelMenuItem(profile.id),
    ...USER_ACCOUNT_HEADER_PRIMARY_MENU_ITEMS,
  ];

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
        <Link
          href={USER_ACCOUNT_PROFILE_MENU_ITEM.href}
          onClick={() => setOpen(false)}
          className={cn("route-accent-surface flex items-center gap-3 rounded-lg border p-3")}
        >
          <Avatar className="route-accent-border h-11 w-11 border">
            <AvatarImage src={avatarSrc} alt={avatarAlt} />
            <AvatarFallback>{getAvatarFallbackText(profile.nickname)}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="route-accent-badge w-fit rounded-md px-1.5 py-0.5 text-xs font-black">
              {USER_ACCOUNT_PROFILE_MENU_ITEM.label}
            </span>
            <span className="text-foreground truncate text-base leading-tight font-black">
              {profile.nickname}
            </span>
          </div>
        </Link>

        <Separator className="my-2" />

        <div className="flex flex-col gap-1">
          {primaryMenuItems.map((item) =>
            UserAccountMenuItemRenderer(item, {
              context: "popover",
              onClose: () => setOpen(false),
              onLogout: handleLogout,
              isLogoutPending: logoutMutation.isPending,
              isCanChangePassword,
            }),
          )}
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-1">
          {USER_ACCOUNT_HEADER_ACCOUNT_MENU_ITEMS.map((item) =>
            UserAccountMenuItemRenderer(item, {
              context: "popover",
              onClose: () => setOpen(false),
              onLogout: handleLogout,
              isLogoutPending: logoutMutation.isPending,
              isCanChangePassword,
            }),
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
