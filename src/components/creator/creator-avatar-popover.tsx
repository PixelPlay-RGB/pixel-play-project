"use client";
// 크리에이터 아바타 트리거 + 요약 Popover(팔로우 토글, 채널 이동)를 공용으로 제공합니다.
// LiveCard / 팔로잉 페이지 / 라이브 사이드바의 아바타에서 공통으로 사용합니다.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tv } from "lucide-react";

import CreatorFollowingButton from "@/components/following/creator-following-button";
import CreatorUnfollowDialog from "@/components/creator/creator-unfollow-dialog";
import {
  CREATOR_AVATAR_TRIGGER_AVATAR_CLASS,
  CREATOR_AVATAR_TRIGGER_CLASS,
} from "@/constants/creator/creator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserProfilePopoverCard } from "@/components/user/user-profile-popover-card";
import { useCreatorFollowState } from "@/hooks/following/use-creator-follow-state";
import { useToggleCreatorFollowing } from "@/hooks/following/use-toggle-creator-following";
import { cn } from "@/lib/utils";
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
  // 라이브 목록 캐시가 없는 화면(클립 디테일 등)에서 토글 후 서버 데이터를 다시 받아
  // isFollowing prop을 갱신하기 위해 router.refresh를 호출할지.
  refreshOnToggle?: boolean;
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
  refreshOnToggle = false,
  avatarClassName,
  avatarSize = "lg",
  triggerClassName,
}: CreatorAvatarPopoverProps) {
  const router = useRouter();
  const toggleCreatorFollowing = useToggleCreatorFollowing();
  const [isUnfollowDialogOpen, setIsUnfollowDialogOpen] = useState(false);

  const avatarSrc = getAvatarImageSrc(creatorPhotoUrl);
  const fallbackText = getAvatarFallbackText(creatorNickname);
  const { isOwnChannel, isPending } = useCreatorFollowState(creatorId, toggleCreatorFollowing);

  const runToggle = (nextFollowing: boolean) => {
    if (isOwnChannel || isPending) return;
    toggleCreatorFollowing.mutate(
      { creatorId, nextFollowing },
      // 라이브 목록 캐시가 없는 화면에선 settle 후 서버 데이터를 다시 받아 버튼 상태를 갱신한다.
      refreshOnToggle ? { onSettled: () => router.refresh() } : undefined,
    );
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
          {/* 카드는 채팅 닉네임 팝오버와 공유 — 라이브 중이면 헤더 전체가 시청 링크(chevron), 아니면 정적. */}
          <UserProfilePopoverCard
            nickname={creatorNickname}
            photoUrl={creatorPhotoUrl}
            liveRing={isLive}
            headerHref={isLive ? `/live/${creatorId}` : undefined}
            headerHrefLabel={isLive ? `${creatorNickname} 라이브 보기` : undefined}
            subHeader={
              isLive ? (
                <span className="text-live inline-flex items-center gap-1.5 text-xs font-bold">
                  <span className="bg-live size-1.5 animate-pulse rounded-full" />
                  지금 라이브 중
                </span>
              ) : isOwnChannel ? (
                <span className="text-muted-foreground text-xs font-medium">내 채널</span>
              ) : undefined
            }
          >
            {/* 채널 이동 + 팔로우를 한 줄에 반반으로. 채널 보기는 secondary, 팔로우는 primary 톤. */}
            <div className="flex items-center gap-2">
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
          </UserProfilePopoverCard>
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
