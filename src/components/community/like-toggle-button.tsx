"use client";
// 좋아요 토글 버튼 공용 표시·게이팅. 게시글/댓글 좋아요가 동일한 하트 스타일·본인 비활성 규칙을 공유한다.
// 토글 동작 자체(mutation)는 호출부가 onToggle으로 주입하고, 본인 판정/로그인 게이팅은 여기서 처리한다.

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useViewerId } from "@/hooks/common/use-viewer-id";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/common/format";

interface Props {
  // 서버에서 확인한 시청자 id(비로그인 null). 인증 게이팅의 1차 기준.
  viewerId: string | null;
  // 콘텐츠 작성자 id. 본인이면 좋아요 비활성.
  authorId: string;
  isLiked: boolean;
  likeCount: number;
  isPending: boolean;
  onToggle: (current: { currentLiked: boolean; currentLikeCount: number }) => void;
  // 본인 콘텐츠일 때 노출할 안내 title(예: "내 글은 좋아요할 수 없어요").
  ownTitle: string;
  className?: string;
}

export function LikeToggleButton({
  viewerId,
  authorId,
  isLiked,
  likeCount,
  isPending,
  onToggle,
  ownTitle,
  className,
}: Props) {
  const currentUserId = useViewerId(viewerId);

  const isOwn = !!currentUserId && currentUserId === authorId;
  const isDisabled = !currentUserId || isOwn;

  const handleClick = () => {
    if (isDisabled || isPending) {
      return;
    }

    onToggle({ currentLiked: isLiked, currentLikeCount: likeCount });
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
      title={isOwn ? ownTitle : undefined}
      className={cn(
        "rounded-full text-xs font-bold transition-all active:scale-95",
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
