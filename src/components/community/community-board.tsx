"use client";
// 채널 커뮤니티 게시글 목록 화면. 페이지네이션과 글쓰기(채널 주인) 진입점을 제공합니다.

import Link from "next/link";
import { PenLine } from "lucide-react";
import { useState } from "react";

import ChatRoomListPagination from "@/components/chat-room-list/chat-room-list-pagination";
import CommunityEmptyState from "@/components/community/community-empty-state";
import CommunityPostList from "@/components/community/community-post-list";
import { Spinner } from "@/components/ui/spinner";
import { COMMUNITY_POST_PAGE_SIZE } from "@/constants/community/community";
import { useCommunityPosts } from "@/hooks/community/use-community-posts";
import type { CommunityPostsResult } from "@/types/community/community";

interface Props {
  creatorId: string;
  isOwner: boolean;
  initialData: CommunityPostsResult;
}

export default function CommunityBoard({ creatorId, isOwner, initialData }: Props) {
  const [page, setPage] = useState(1);
  const { data, isPending, isFetching } = useCommunityPosts(creatorId, page, initialData);

  const result = data ?? initialData;
  const totalPages = Math.max(1, Math.ceil(result.totalCount / COMMUNITY_POST_PAGE_SIZE));

  return (
    <section className="flex flex-col gap-4">
      {isOwner && (
        <Link
          href={`/channel/${creatorId}/community/write`}
          className="border-border/60 bg-card/60 hover:border-brand/30 hover:bg-card flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors"
        >
          <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
            <PenLine className="size-4" />
          </span>
          <span className="text-muted-foreground text-sm">어떤 이야기를 남겨볼까요?</span>
        </Link>
      )}

      {isPending ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-muted-foreground size-6" />
        </div>
      ) : result.items.length === 0 ? (
        <CommunityEmptyState
          message={isOwner ? "첫 소식을 남겨 팔로워와 소통해보세요." : "아직 작성된 글이 없어요."}
        />
      ) : (
        <>
          <CommunityPostList
            creatorId={creatorId}
            creator={result.creator}
            posts={result.items}
            isOwner={isOwner}
          />
          <ChatRoomListPagination
            currentPage={page}
            totalPages={totalPages}
            isFetching={isFetching}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
