"use client";
// 크리에이터 아바타 트리거 + 요약 Popover(팔로우 토글, 채널 이동)를 공용으로 제공합니다.
// LiveCard / 팔로잉 페이지 / 라이브 사이드바의 아바타에서 공통으로 사용합니다.

import { useState } from "react";
import Link from "next/link";
import { Radio } from "lucide-react";

import CreatorFollowingButton from "@/components/following/creator-following-button";
import CreatorUnfollowDialog from "@/components/creator/creator-unfollow-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToggleCreatorFollowing } from "@/hooks/following/use-toggle-creator-following";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface CreatorAvatarPopoverProps {
  creatorId: string;
  creatorNickname: string;
  creatorPhotoUrl: string | null;
  isFollowing: boolean;
  // 현재 라이브 여부 (팝오버 안내 문구 + 채널 이동 라벨)
  isLive?: boolean;
  // 아바타에 상시 라이브 링/LIVE 펠릿 노출 여부
  showLiveRing?: boolean;
  showLivePill?: boolean;
  // 언팔로우 시 확인 다이얼로그를 띄울지 (팔로잉 관리 화면 등)
  confirmUnfollow?: boolean;
  avatarClassName?: string;
  avatarSize?: "default" | "sm" | "lg";
  triggerClassName?: string;
}

export default function CreatorAvatarPopover({
  creatorId,
  creatorNickname,
  creatorPhotoUrl,
  isFollowing,
  isLive = false,
  showLiveRing = false,
  showLivePill = false,
  confirmUnfollow = false,
  avatarClassName,
  avatarSize = "lg",
  triggerClassName,
}: CreatorAvatarPopoverProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const toggleCreatorFollowing = useToggleCreatorFollowing();
  const [isUnfollowDialogOpen, setIsUnfollowDialogOpen] = useState(false);

  const avatarSrc = getAvatarImageSrc(creatorPhotoUrl);
  const fallbackText = getAvatarFallbackText(creatorNickname);
  const isOwnChannel = currentUserId === creatorId;
  const isPending =
    toggleCreatorFollowing.isPending && toggleCreatorFollowing.variables?.creatorId === creatorId;

  const runToggle = (nextFollowing: boolean) => {
    if (isOwnChannel || isPending) return;
    toggleCreatorFollowing.mutate({ creatorId, nextFollowing });
  };

  const handleFollowingClick = () => {
    if (isOwnChannel || isPending) return;

    // 언팔로우 확인이 필요한 화면에서는 다이얼로그로 한 번 더 확인합니다.
    if (isFollowing && confirmUnfollow) {
      setIsUnfollowDialogOpen(true);
      return;
    }

    runToggle(!isFollowing);
  };

  const handleConfirmUnfollow = () => {
    runToggle(false);
    setIsUnfollowDialogOpen(false);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger
          type="button"
          aria-label={`${creatorNickname} 프로필 요약 열기`}
          className={cn(
            "group/avatar-trigger focus-visible:ring-ring relative z-20 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-3",
            triggerClassName,
          )}
        >
          <Avatar
            className={cn(
              "transition-[box-shadow]",
              "group-hover/avatar-trigger:ring-live/70 group-focus-visible/avatar-trigger:ring-live/70 group-hover/avatar-trigger:ring-2 group-focus-visible/avatar-trigger:ring-2",
              showLiveRing && "ring-live/80 ring-2",
              avatarClassName,
            )}
            size={avatarSize}
          >
            <AvatarImage src={avatarSrc} alt={`${creatorNickname} 프로필 이미지`} />
            <AvatarFallback>{fallbackText}</AvatarFallback>
          </Avatar>

          {showLivePill && (
            <span className="bg-live text-live-foreground ring-card absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[10px] leading-4 font-black tracking-wide ring-2">
              LIVE
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent className="w-72 gap-0 overflow-hidden p-0" align="start" sideOffset={10}>
          <div className="flex min-w-0 items-center gap-3 px-4 pt-4 pb-3.5">
            <Avatar className={cn("size-12 shrink-0", isLive && "ring-live/80 ring-2")} size="lg">
              <AvatarImage src={avatarSrc} alt={`${creatorNickname} 프로필 이미지`} />
              <AvatarFallback>{fallbackText}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-black">{creatorNickname}</p>
              {isLive ? (
                <span className="text-live mt-1 inline-flex items-center gap-1.5 text-xs font-bold">
                  <span className="bg-live size-1.5 animate-pulse rounded-full" />
                  지금 라이브 중
                </span>
              ) : (
                <p className="text-muted-foreground mt-1 truncate text-xs font-medium">
                  {isOwnChannel ? "내 라이브 채널" : "팔로우 중인 채널"}
                </p>
              )}
            </div>
          </div>

          <div className="border-border/60 bg-muted/30 flex flex-col gap-2 border-t px-3 py-3">
            {/* 라이브 중이면 시청 페이지로, 아니면 공개 채널 페이지로 이동합니다. */}
            <Link
              href={isLive ? `/live/${creatorId}` : `/channel/${creatorId}`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-8 w-full justify-center gap-1.5 rounded-full px-3 text-xs font-black",
                isLive
                  ? "bg-live hover:bg-live/85 shadow-live/25 text-white shadow-sm hover:shadow-md"
                  : "border-border bg-background text-foreground hover:bg-muted border",
              )}
            >
              <Radio className="size-3.5" />
              {isLive ? "라이브 보기" : "채널 보기"}
            </Link>

            <CreatorFollowingButton
              creatorNickname={creatorNickname}
              isFollowing={isFollowing}
              isOwnChannel={isOwnChannel}
              isPending={isPending}
              onClick={handleFollowingClick}
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>

      {confirmUnfollow && (
        <CreatorUnfollowDialog
          open={isUnfollowDialogOpen}
          onOpenChange={setIsUnfollowDialogOpen}
          creatorNickname={creatorNickname}
          isPending={isPending}
          onConfirm={handleConfirmUnfollow}
        />
      )}
    </>
  );
}
