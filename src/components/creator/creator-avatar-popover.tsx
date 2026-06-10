"use client";
// 크리에이터 아바타 트리거 + 요약 Popover(팔로우 토글, 채널 이동)를 공용으로 제공합니다.
// LiveCard / 팔로잉 페이지 / 라이브 사이드바의 아바타에서 공통으로 사용합니다.

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Tv } from "lucide-react";

import CreatorFollowingButton from "@/components/following/creator-following-button";
import CreatorUnfollowDialog from "@/components/creator/creator-unfollow-dialog";
import {
  CREATOR_AVATAR_TRIGGER_AVATAR_CLASS,
  CREATOR_AVATAR_TRIGGER_CLASS,
} from "@/constants/creator/creator";
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
            CREATOR_AVATAR_TRIGGER_CLASS,
            "relative z-20 cursor-pointer",
            triggerClassName,
          )}
        >
          <Avatar
            className={cn(
              CREATOR_AVATAR_TRIGGER_AVATAR_CLASS,
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
          {/* 라이브 중이면 프로필 카드 = 라이브 시청 링크(hover 강조 + chevron). 아니면 정적 정보 카드(채널 이동은 하단 버튼). */}
          {isLive ? (
            <Link
              href={`/live/${creatorId}`}
              aria-label={`${creatorNickname} 라이브 보기`}
              className="group/profile hover:bg-muted/50 flex min-w-0 items-center gap-3 px-4 pt-4 pb-3.5 transition-colors"
            >
              <Avatar className="ring-live/80 size-12 shrink-0 ring-2" size="lg">
                <AvatarImage src={avatarSrc} alt={`${creatorNickname} 프로필 이미지`} />
                <AvatarFallback>{fallbackText}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-foreground group-hover/profile:text-brand truncate text-sm font-black transition-colors">
                  {creatorNickname}
                </p>
                <span className="text-live mt-1 inline-flex items-center gap-1.5 text-xs font-bold">
                  <span className="bg-live size-1.5 animate-pulse rounded-full" />
                  지금 라이브 중
                </span>
              </div>
              <ChevronRight className="text-muted-foreground/70 group-hover/profile:text-brand size-4 shrink-0 transition-all group-hover/profile:translate-x-0.5" />
            </Link>
          ) : (
            <div className="flex min-w-0 items-center gap-3 px-4 pt-4 pb-3.5">
              <Avatar className="size-12 shrink-0" size="lg">
                <AvatarImage src={avatarSrc} alt={`${creatorNickname} 프로필 이미지`} />
                <AvatarFallback>{fallbackText}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-black">{creatorNickname}</p>
                {isOwnChannel && (
                  <p className="text-muted-foreground mt-1 truncate text-xs font-medium">내 채널</p>
                )}
              </div>
            </div>
          )}

          {/* 채널 이동 + 팔로우를 한 줄에 반반으로. 채널 보기는 secondary, 팔로우는 primary 톤. */}
          <div className="border-border/60 bg-muted/30 flex items-center gap-2 border-t px-3 py-3">
            <Link
              href={`/channel/${creatorId}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 flex-1 justify-center gap-1.5 rounded-full px-3 text-xs font-bold",
              )}
            >
              <Tv className="size-3.5" />
              채널 보기
            </Link>

            <div className="flex-1">
              <CreatorFollowingButton
                creatorNickname={creatorNickname}
                isFollowing={isFollowing}
                isOwnChannel={isOwnChannel}
                isPending={isPending}
                onClick={handleFollowingClick}
                className="w-full"
              />
            </div>
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
