"use client";
// 게시글 상세의 댓글 목록입니다. 페이지 단위로 조회합니다.

import { useState } from "react";

import ChatRoomListPagination from "@/components/chat-room-list/chat-room-list-pagination";
import CommunityCommentItem from "@/components/community/community-comment-item";
import { Spinner } from "@/components/ui/spinner";
import { COMMUNITY_COMMENT_PAGE_SIZE } from "@/constants/community/community";
import { useCommunityComments } from "@/hooks/community/use-community-comments";
import type { CommunityCommentsResult } from "@/types/community/community";

interface Props {
  postId: string;
  isChannelOwner: boolean;
  initialData?: CommunityCommentsResult;
}

export default function CommunityCommentList({ postId, isChannelOwner, initialData }: Props) {
  const [page, setPage] = useState(1);
  const { data, isPending, isFetching } = useCommunityComments(postId, page, initialData);

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="text-muted-foreground size-6" />
      </div>
    );
  }

  const comments = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / COMMUNITY_COMMENT_PAGE_SIZE));

  if (comments.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm font-semibold">
        가장 먼저 댓글을 남겨보세요.
      </p>
    );
  }

  return (
    <div>
      <ul className="divide-border/60 divide-y">
        {comments.map((comment) => (
          <li key={comment.id}>
            <CommunityCommentItem
              postId={postId}
              comment={comment}
              isChannelOwner={isChannelOwner}
            />
          </li>
        ))}
      </ul>

      <ChatRoomListPagination
        currentPage={page}
        totalPages={totalPages}
        isFetching={isFetching}
        onPageChange={setPage}
      />
    </div>
  );
}
