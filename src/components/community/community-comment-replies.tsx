"use client";
// 대댓글 목록(토글 시 지연 로드 + "답글 더보기" 페이지네이션) + 대댓글 작성 폼.

import { ChevronDown } from "lucide-react";

import CommunityCommentComposer from "@/components/community/community-comment-composer";
import CommunityCommentItem from "@/components/community/community-comment-item";
import { CommunityCommentItemSkeleton } from "@/components/community/community-comment-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useCommunityCommentReplies } from "@/hooks/community/use-community-comment-replies";

interface Props {
  postId: string;
  // 서버에서 확인한 시청자 id(비로그인 null). 인증 게이팅의 1차 기준.
  viewerId: string | null;
  parentId: string;
  isChannelOwner: boolean;
}

export default function CommunityCommentReplies({
  postId,
  viewerId,
  parentId,
  isChannelOwner,
}: Props) {
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommunityCommentReplies(parentId, true);
  const replies = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="border-border/50 mt-2 ml-1 space-y-1 border-l-2 pl-3">
      {isPending ? (
        <CommunityCommentItemSkeleton isReply />
      ) : (
        replies.map((reply) => (
          <CommunityCommentItem
            key={reply.id}
            postId={postId}
            viewerId={viewerId}
            comment={reply}
            isChannelOwner={isChannelOwner}
            isReply
          />
        ))
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-muted-foreground hover:text-foreground inline-flex h-7 items-center gap-1 text-xs font-semibold disabled:opacity-60"
        >
          {isFetchingNextPage ? (
            <Spinner className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
          답글 더보기
        </button>
      )}

      <div className="pt-1">
        <CommunityCommentComposer postId={postId} viewerId={viewerId} parentId={parentId} compact />
      </div>
    </div>
  );
}
