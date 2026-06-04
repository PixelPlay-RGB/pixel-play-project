"use client";
// 게시글 상세의 댓글 목록. 정렬(등록·인기·최신) + 베스트 고정 + 페이지네이션.

import { useState } from "react";

import ChatRoomListPagination from "@/components/chat-room-list/chat-room-list-pagination";
import CommunityCommentItem from "@/components/community/community-comment-item";
import { Spinner } from "@/components/ui/spinner";
import {
  COMMUNITY_COMMENT_DEFAULT_SORT,
  COMMUNITY_COMMENT_PAGE_SIZE,
  COMMUNITY_COMMENT_SORTS,
} from "@/constants/community/community";
import { useCommunityComments } from "@/hooks/community/use-community-comments";
import { cn } from "@/lib/utils";
import type { CommunityCommentSort, CommunityCommentsResult } from "@/types/community/community";

interface Props {
  postId: string;
  isChannelOwner: boolean;
  initialData?: CommunityCommentsResult;
}

export default function CommunityCommentList({ postId, isChannelOwner, initialData }: Props) {
  const [sort, setSort] = useState<CommunityCommentSort>(COMMUNITY_COMMENT_DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const { data, isPending, isFetching } = useCommunityComments(postId, page, sort, initialData);

  const handleSortChange = (next: CommunityCommentSort) => {
    if (next === sort) return;
    setSort(next);
    setPage(1);
  };

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / COMMUNITY_COMMENT_PAGE_SIZE));
  // 베스트는 첫 페이지에서만 맨 위 고정.
  const bestComment = page === 1 ? (data?.bestComment ?? null) : null;
  const items = data?.items ?? [];
  const isEmpty = !bestComment && items.length === 0;

  return (
    <div>
      <div className="flex items-center justify-end gap-0.5 pb-1">
        {COMMUNITY_COMMENT_SORTS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSortChange(option.value)}
            aria-pressed={sort === option.value}
            className={cn(
              "rounded-full px-2 py-1 text-xs font-bold transition-colors",
              sort === option.value ? "text-brand" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="flex justify-center py-10">
          <Spinner className="text-muted-foreground size-6" />
        </div>
      ) : isEmpty ? (
        <p className="text-muted-foreground py-10 text-center text-sm font-semibold">
          가장 먼저 댓글을 남겨보세요.
        </p>
      ) : (
        <>
          <ul className="divide-border/60 divide-y">
            {bestComment && (
              <li>
                <CommunityCommentItem
                  postId={postId}
                  comment={bestComment}
                  isChannelOwner={isChannelOwner}
                  isBest
                />
              </li>
            )}
            {items.map((comment) => (
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
        </>
      )}
    </div>
  );
}
