"use client";
// 게시글 좋아요(버프) 토글 버튼입니다.

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToggleCommunityPostLike } from "@/hooks/community/use-toggle-community-post-like";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface Props {
  postId: string;
  isLiked: boolean;
  likeCount: number;
  className?: string;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function CommunityLikeButton({ postId, isLiked, likeCount, className }: Props) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const toggleLike = useToggleCommunityPostLike(postId);

  const handleClick = () => {
    if (!currentUserId) {
      return;
    }

    if (toggleLike.isPending) {
      return;
    }

    toggleLike.mutate({ currentLiked: isLiked, currentLikeCount: likeCount });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={!currentUserId}
      aria-pressed={isLiked}
      aria-label={isLiked ? "좋아요 취소" : "좋아요"}
      className={cn(
        "h-8 rounded-full px-3 text-xs font-bold transition-all active:scale-95",
        isLiked
          ? "border-brand/30 bg-brand/10 text-brand hover:bg-brand/15"
          : "text-muted-foreground hover:text-brand",
        className,
      )}
    >
      <Heart className={cn("size-3.5", isLiked && "fill-current")} />
      {numberFormatter.format(likeCount)}
    </Button>
  );
}
