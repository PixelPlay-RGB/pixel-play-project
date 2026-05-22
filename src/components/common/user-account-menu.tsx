"use client";
// 헤더 사용자 계정 메뉴를 렌더링합니다.

import PasswordDialog from "@/components/auth/password/password-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/hooks/auth/use-logout";
import { cn } from "@/lib/utils";
import type { CurrentProfileSnapshot } from "@/types/profile/user";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { ChevronDown, Heart, Key, LogOut, Radio, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Props {
  profile: CurrentProfileSnapshot;
}

const MENU_ITEM_CLASS = cn(
  buttonVariants({ variant: "ghost" }),
  "route-accent-hover h-10 w-full justify-start gap-3 rounded-lg px-3 text-sm font-semibold",
);

const DISABLED_MENU_ITEM_CLASS = cn(
  MENU_ITEM_CLASS,
  "text-muted-foreground/60 hover:bg-transparent hover:text-muted-foreground/60 cursor-not-allowed",
);

export default function UserAccountMenu({ profile }: Props) {
  const logoutMutation = useLogout();
  const [open, setOpen] = useState(false);
  const [donationMenuOpen, setDonationMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync().catch(() => undefined);
  };

  const isCanChangePassword = profile.linked_providers.includes("email");
  const avatarSrc = getAvatarImageSrc(profile.photo_url);
  const avatarAlt = `${profile.nickname}의 프로필 사진`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          href="/user/profile"
          onClick={() => setOpen(false)}
          className={cn("route-accent-surface flex items-center gap-3 rounded-lg border p-3")}
        >
          <Avatar className="route-accent-border h-11 w-11 border">
            <AvatarImage src={avatarSrc} alt={avatarAlt} />
            <AvatarFallback>{getAvatarFallbackText(profile.nickname)}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="route-accent-badge w-fit rounded-md px-1.5 py-0.5 text-xs font-black">
              프로필 설정
            </span>
            <span className="text-foreground truncate text-base leading-tight font-black">
              {profile.nickname}
            </span>
          </div>
        </Link>

        <Separator className="my-2" />

        <div className="flex flex-col gap-1">
          <button type="button" disabled className={DISABLED_MENU_ITEM_CLASS}>
            <Radio className="size-4" />
            채널 관리
          </button>
          <button type="button" disabled className={DISABLED_MENU_ITEM_CLASS}>
            <Star className="size-4" />
            팔로우
          </button>

          <div className="bg-muted/40 rounded-lg p-1">
            <button
              type="button"
              className={cn(MENU_ITEM_CLASS, "text-muted-foreground justify-between")}
              onClick={() => setDonationMenuOpen((current) => !current)}
              aria-expanded={donationMenuOpen}
            >
              <span className="flex items-center gap-3">
                <Heart className="size-4" />
                후원
              </span>
              <ChevronDown
                className={cn("size-4 transition-transform", donationMenuOpen && "rotate-180")}
              />
            </button>
            {donationMenuOpen && (
              <div className="ml-7 flex flex-col py-1">
                <button
                  type="button"
                  disabled
                  className={cn(DISABLED_MENU_ITEM_CLASS, "h-8 text-xs")}
                >
                  후원 홈
                </button>
                <button
                  type="button"
                  disabled
                  className={cn(DISABLED_MENU_ITEM_CLASS, "h-8 text-xs")}
                >
                  후원금 충전
                </button>
                <button
                  type="button"
                  disabled
                  className={cn(DISABLED_MENU_ITEM_CLASS, "h-8 text-xs")}
                >
                  후원 내역
                </button>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-1">
          {isCanChangePassword && (
            <PasswordDialog className={MENU_ITEM_CLASS} label="비밀번호 변경" icon={Key} />
          )}
          <Button
            variant="ghost"
            className={cn(MENU_ITEM_CLASS, "text-muted-foreground")}
            onClick={() => void handleLogout()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? <Spinner /> : <LogOut className="size-4" />}
            로그아웃
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
