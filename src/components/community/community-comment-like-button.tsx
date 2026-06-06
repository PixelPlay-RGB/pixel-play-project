"use client";
// 댓글/대댓글 좋아요 토글 버튼. 게시글 좋아요와 동일한 하트 스타일. 본인 댓글은 비활성.

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToggleCommunityCommentLike } from "@/hooks/community/use-toggle-community-comment-like";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { formatNumber } from "@/utils/common/format";

interface Props {
  commentId: string;
  // 서버에서 확인한 시청자 id(비로그인 null). 인증 게이팅의 1차 기준.
  viewerId: string | null;
  // 댓글 작성자 id. 본인이면 좋아요 비활성.
  authorId: string;
  isLiked: boolean;
  likeCount: number;
}

export default function CommunityCommentLikeButton({
  commentId,
  viewerId,
  authorId,
  isLiked,
  likeCount,
}: Props) {
  // 서버 viewerId 우선, 클라 Zustand는 보조.
  const storeUserId = useAuthStore((state) => state.user?.id);
  const currentUserId = viewerId ?? storeUserId;
  const toggleLike = useToggleCommunityCommentLike();

  const isOwn = !!currentUserId && currentUserId === authorId;
  const isDisabled = !currentUserId || isOwn;

  const handleClick = () => {
    if (isDisabled || toggleLike.isPending) {
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
      disabled={isDisabled}
      aria-pressed={isLiked}
      aria-label={isLiked ? "좋아요 취소" : "좋아요"}
      title={isOwn ? "내 댓글은 좋아요할 수 없어요" : undefined}
      className={cn(
        "h-7 gap-1 rounded-full px-2.5 text-xs font-bold transition-all active:scale-95",
        isLiked
          ? "border-brand/30 bg-brand/10 text-brand hover:bg-brand/15"
          : "text-muted-foreground hover:text-brand",
      )}
    >
      <Heart className={cn("size-3.5", isLiked && "fill-current")} />
      {formatNumber(likeCount)}
    </Button>
  );
}
