"use client";

import SettingMenuItem from "@/components/setting/setting-menu-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SETTING_MENU } from "@/constants/setting-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import { cn } from "@/lib/utils";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/avatar";
import type { CurrentProfileSnapshot } from "@/utils/profile-server";
import Link from "next/link";
import { useState } from "react";

interface Props {
  profile: CurrentProfileSnapshot;
}

export default function HeaderProfileBadge({ profile }: Props) {
  const logoutMutation = useLogout();

  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync().catch(() => undefined);
  };

  const isCanChangePassword = profile.linked_providers.includes("email");
  const avatarSrc = getAvatarImageSrc(profile.photo_url);
  const avatarAlt = `${profile.nickname}의 프로필 사진`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="cursor-pointer outline-none hover:opacity-80"
        aria-label="프로필 메뉴 열기"
      >
        <Avatar className={cn("ring-brand ring-2 transition-all duration-200 hover:ring-[3px]")}>
          <AvatarImage src={avatarSrc} alt={avatarAlt} />
          <AvatarFallback>{getAvatarFallbackText(profile.nickname)}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>

      <PopoverContent className="max-w-max min-w-60 overflow-hidden" align="end">
        <Link
          href={"/profile"}
          onClick={() => setOpen(false)}
          className="hover:bg-muted flex items-center gap-4 rounded-lg p-1"
        >
          <Avatar className="border-brand/10 h-12 w-12 border">
            <AvatarImage src={avatarSrc} alt={avatarAlt} />
            <AvatarFallback>{getAvatarFallbackText(profile.nickname)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <p className={"bg-muted text-brand rounded-sm px-1 py-0.5 text-xs"}>프로필 설정</p>
            <p className="text-foreground keep-space text-lg leading-tight font-bold tracking-tight">
              {profile.nickname}
            </p>
          </div>
        </Link>

        <Separator className={"my-1"} />

        <div className="flex flex-col">
          {SETTING_MENU.map((item) =>
            SettingMenuItem(
              item,
              {
                onClose: () => setOpen(false),
                onLogout: handleLogout,
                isLogoutPending: logoutMutation.isPending,
                // actions: {
                //   settings: handleSetting
                // }
              },
              isCanChangePassword,
            ),
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
