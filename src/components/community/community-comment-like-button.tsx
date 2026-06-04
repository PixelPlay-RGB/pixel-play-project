"use client";
// 댓글/대댓글 좋아요 토글 버튼. 게시글 좋아요(community-like-button)와 동일한 하트 스타일.

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToggleCommunityCommentLike } from "@/hooks/community/use-toggle-community-comment-like";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface Props {
  commentId: string;
  isLiked: boolean;
  likeCount: number;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function CommunityCommentLikeButton({ commentId, isLiked, likeCount }: Props) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const toggleLike = useToggleCommunityCommentLike();

  const handleClick = () => {
    if (!currentUserId || toggleLike.isPending) {
      return;
    }

    toggleLike.mutate({ commentId, currentLiked: isLiked, currentLikeCount: likeCount });
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
        "h-7 gap-1 rounded-full px-2.5 text-xs font-bold transition-all active:scale-95",
        isLiked
          ? "border-brand/30 bg-brand/10 text-brand hover:bg-brand/15"
          : "text-muted-foreground hover:text-brand",
      )}
    >
      <Heart className={cn("size-3.5", isLiked && "fill-current")} />
      {numberFormatter.format(likeCount)}
    </Button>
  );
}
