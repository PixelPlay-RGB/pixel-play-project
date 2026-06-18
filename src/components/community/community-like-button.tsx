"use client";
// 게시글 좋아요 토글 버튼. 표시·게이팅은 공용 LikeToggleButton에 위임하고, 토글 mutation만 주입한다.
// 본인 글은 좋아요할 수 없습니다.

import { LikeToggleButton } from "@/components/community/like-toggle-button";
import { useToggleCommunityPostLike } from "@/hooks/community/use-toggle-community-post-like";
import { cn } from "@/lib/utils";

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
  const toggleLike = useToggleCommunityPostLike(postId);

  return (
    <LikeToggleButton
      viewerId={viewerId}
      authorId={authorId}
      isLiked={isLiked}
      likeCount={likeCount}
      isPending={toggleLike.isPending}
      onToggle={(current) => toggleLike.mutate(current)}
      ownTitle="내 글은 좋아요할 수 없어요"
      className={cn("h-8 px-3", className)}
    />
  );
}
