"use client";
// 크리에이터 팔로잉 토글 버튼 UI를 렌더링합니다.

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreatorFollowingButtonProps {
  creatorNickname: string;
  isFollowing: boolean;
  isOwnChannel: boolean;
  isPending: boolean;
  onClick: () => void;
  className?: string;
}

export default function CreatorFollowingButton({
  creatorNickname,
  isFollowing,
  isOwnChannel,
  isPending,
  onClick,
  className,
}: CreatorFollowingButtonProps) {
  const label = isOwnChannel ? "내 채널" : isFollowing ? "팔로잉" : "팔로우";

  return (
    <Button
      type="button"
      size="sm"
      variant={isFollowing || isOwnChannel ? "outline" : "default"}
      className={cn(
        "h-8 shrink-0 rounded-full px-3 text-xs font-black transition-all active:scale-95",
        isFollowing || isOwnChannel
          ? "border-brand/25 bg-brand/10 text-brand hover:border-brand/50 hover:bg-brand/18 dark:border-brand/25 dark:bg-brand/15 dark:text-brand"
          : "bg-brand hover:bg-brand/85 shadow-brand/25 text-white shadow-sm hover:shadow-md",
        className,
      )}
      disabled={isOwnChannel || isPending}
      aria-label={`${creatorNickname} ${label}`}
      onClick={onClick}
    >
      <Heart className={cn("size-3.5", isFollowing && "fill-current")} />
      {label}
    </Button>
  );
}
