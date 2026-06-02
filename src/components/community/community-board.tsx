"use client";
// 채널 커뮤니티 게시글 목록 화면. 페이지네이션과 글쓰기(채널 주인) 진입점을 제공합니다.

import Link from "next/link";
import { PenLine } from "lucide-react";
import { useState } from "react";

import ChatRoomListPagination from "@/components/chat-room-list/chat-room-list-pagination";
import CommunityEmptyState from "@/components/community/community-empty-state";
import CommunityPostList from "@/components/community/community-post-list";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-base font-black">
          커뮤니티
          <span className="text-muted-foreground ml-2 text-sm font-bold">
            {result.totalCount.toLocaleString("ko-KR")}
          </span>
        </h2>

        {isOwner && (
          <Button
            render={
              <Link href={`/channel/${creatorId}/community/write`}>
                <PenLine className="size-4" />
                글쓰기
              </Link>
            }
            className="bg-brand hover:bg-brand/85 h-9 rounded-xl px-4 text-sm font-bold text-white"
          />
        )}
      </div>

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
          <CommunityPostList creatorId={creatorId} creator={result.creator} posts={result.items} />
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
