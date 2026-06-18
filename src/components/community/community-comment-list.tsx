"use client";
// 댓글 영역: 헤더(댓글 N + 새로고침 | 정렬) + 입력창 + 목록. 치지직 레이아웃.

import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, RotateCw } from "lucide-react";
import { Fragment, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import ListPagination from "@/components/common/list-pagination";
import CommunityCommentComposer from "@/components/community/community-comment-composer";
import CommunityCommentItem from "@/components/community/community-comment-item";
import { CommunityCommentListSkeleton } from "@/components/community/community-comment-skeleton";
import {
  COMMUNITY_COMMENT_DEFAULT_SORT,
  COMMUNITY_COMMENT_PAGE_SIZE,
  COMMUNITY_COMMENT_SORTS,
} from "@/constants/community/community";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useCommunityComments } from "@/hooks/community/use-community-comments";
import { cn } from "@/lib/utils";
import type { CommunityCommentSort, CommunityCommentsResult } from "@/types/community/community";
import { formatNumber } from "@/utils/common/format";

interface Props {
  postId: string;
  // 서버에서 확인한 시청자 id(비로그인 null). 인증 게이팅의 1차 기준.
  viewerId: string | null;
  // 전체 댓글 수(대댓글 포함). 헤더에 표시.
  commentCount: number;
  isChannelOwner: boolean;
  initialData?: CommunityCommentsResult;
}

export default function CommunityCommentList({
  postId,
  viewerId,
  commentCount,
  isChannelOwner,
  initialData,
}: Props) {
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<CommunityCommentSort>(COMMUNITY_COMMENT_DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const { data, isPending, isFetching } = useCommunityComments(postId, page, sort, initialData);

  const handleSortChange = (next: CommunityCommentSort) => {
    if (next === sort) return;
    setSort(next);
    setPage(1);
  };

  // 커뮤니티는 실시간 구독이 아니므로 수동 새로고침으로 최신 댓글을 반영합니다.
  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.commentsAll() });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.commentRepliesAll() });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.post(postId) });
  };

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / COMMUNITY_COMMENT_PAGE_SIZE));
  // 베스트는 첫 페이지에서만 맨 위 고정.
  const bestComment = page === 1 ? (data?.bestComment ?? null) : null;
  const items = data?.items ?? [];
  const isEmpty = !bestComment && items.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-foreground text-sm font-black">댓글 {formatNumber(commentCount)}</h2>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="댓글 새로고침"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCw className={cn("size-4", isFetching && "animate-spin")} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          {COMMUNITY_COMMENT_SORTS.map((option, index) => (
            <Fragment key={option.value}>
              {index > 0 && <span className="text-muted-foreground/40">·</span>}
              <button
                type="button"
                onClick={() => handleSortChange(option.value)}
                aria-pressed={sort === option.value}
                className={cn(
                  "transition-colors",
                  sort === option.value
                    ? "text-brand"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            </Fragment>
          ))}
        </div>
      </div>

      <CommunityCommentComposer postId={postId} viewerId={viewerId} />

      {isPending ? (
        <CommunityCommentListSkeleton />
      ) : isEmpty ? (
        <EmptyState
          icon={<MessageSquare className="size-7" />}
          title="가장 먼저 댓글을 남겨보세요."
        />
      ) : (
        <>
          <ul className="divide-border/60 divide-y">
            {bestComment && (
              <li>
                <CommunityCommentItem
                  postId={postId}
                  viewerId={viewerId}
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
                  viewerId={viewerId}
                  comment={comment}
                  isChannelOwner={isChannelOwner}
                />
              </li>
            ))}
          </ul>

          <ListPagination
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
