"use client";
// 게시글 좋아요 토글 버튼. 본인 글은 좋아요할 수 없습니다.

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useViewerId } from "@/hooks/common/use-viewer-id";
import { useToggleCommunityPostLike } from "@/hooks/community/use-toggle-community-post-like";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/common/format";

interface Props {
  postId: string;
  // 서버에서 확인한 시청자 id(비로그인 null). 인증 게이팅의 1차 기준.
  viewerId: string | null;
  // 글 작성자(=채널 주인) id. 본인이면 좋아요 비활성.
  authorId: string;
  isLiked: boolean;
  likeCount: number;
  className?: string;
}

export default function CommunityLikeButton({
  postId,
  viewerId,
  authorId,
  isLiked,
  likeCount,
  className,
}: Props) {
  const currentUserId = useViewerId(viewerId);
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
      {formatNumber(likeCount)}
    </Button>
  );
}
