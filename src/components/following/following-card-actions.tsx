"use client";
// 팔로잉 채널 카드의 액션 영역(보러가기 + 팔로잉 토글)을 렌더링합니다.

import Link from "next/link";
import { Eye } from "lucide-react";

import CreatorFollowingButton from "@/components/following/creator-following-button";
import { buttonVariants } from "@/components/ui/button";
import { useToggleCreatorFollowing } from "@/hooks/following/use-toggle-creator-following";
import { cn } from "@/lib/utils";

interface FollowingCardActionsProps {
  creatorId: string;
  creatorNickname: string;
  isLive: boolean;
}

export default function FollowingCardActions({
  creatorId,
  creatorNickname,
  isLive,
}: FollowingCardActionsProps) {
  const { mutate, isPending } = useToggleCreatorFollowing();

  const handleUnfollow = () => {
    mutate({ creatorId, nextFollowing: false });
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      {isLive ? (
        <Link
          href={`/live/${creatorId}`}
          aria-label={`${creatorNickname} 라이브 보러가기`}
          className={cn(
            buttonVariants({ size: "sm" }),
            "bg-brand hover:bg-brand/85 shadow-brand/25 h-8 rounded-full px-3 text-xs font-black text-white shadow-sm hover:shadow-md",
          )}
        >
          <Eye className="size-3.5" />
          <span className="hidden sm:inline">보러가기</span>
        </Link>
      ) : null}
      <CreatorFollowingButton
        creatorNickname={creatorNickname}
        isFollowing
        isOwnChannel={false}
        isPending={isPending}
        onClick={handleUnfollow}
      />
    </div>
  );
}
