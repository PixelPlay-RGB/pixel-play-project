"use client";
// 댓글/대댓글 좋아요 토글 버튼. 표시·게이팅은 공용 LikeToggleButton에 위임한다.
// 게시글 좋아요와 동일한 하트 스타일. 본인 댓글은 비활성.

import { LikeToggleButton } from "@/components/community/like-toggle-button";
import { useToggleCommunityCommentLike } from "@/hooks/community/use-toggle-community-comment-like";

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
  const toggleLike = useToggleCommunityCommentLike();

  return (
    <LikeToggleButton
      viewerId={viewerId}
      authorId={authorId}
      isLiked={isLiked}
      likeCount={likeCount}
      isPending={toggleLike.isPending}
      onToggle={(current) => toggleLike.mutate({ commentId, ...current })}
      ownTitle="내 댓글은 좋아요할 수 없어요"
      className="h-7 gap-1 px-2.5"
    />
  );
}
