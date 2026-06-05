"use client";
// 게시글 좋아요 토글 버튼. 본인 글은 좋아요할 수 없습니다.

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToggleCommunityPostLike } from "@/hooks/community/use-toggle-community-post-like";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface Props {
  postId: string;
  // 글 작성자(=채널 주인) id. 본인이면 좋아요 비활성.
  authorId: string;
  isLiked: boolean;
  likeCount: number;
  className?: string;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function CommunityLikeButton({
  postId,
  authorId,
  isLiked,
  likeCount,
  className,
}: Props) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const toggleLike = useToggleCommunityPostLike(postId);

  const isOwn = !!currentUserId && currentUserId === authorId;
  const isDisabled = !currentUserId || isOwn;

  const handleClick = () => {
    if (isDisabled || toggleLike.isPending) {
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
      disabled={isDisabled}
      aria-pressed={isLiked}
      aria-label={isLiked ? "좋아요 취소" : "좋아요"}
      title={isOwn ? "내 글은 좋아요할 수 없어요" : undefined}
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
