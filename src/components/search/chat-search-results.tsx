"use client";

// 채팅방 검색 결과를 조회하고 제목/방장 섹션으로 나눠 표시합니다.
import ChatRoomCardGridSkeleton from "@/components/chat-room/shared/chat-room-card-grid-skeleton";
import ChatSearchSection from "@/components/search/chat-search-section";
import { useChatRoomSearch } from "@/hooks/use-chat-room-search";
import { cn } from "@/lib/utils";
import type { ChatSearchResult } from "@/types/search";
import { Search } from "lucide-react";

interface Props {
  query: string;
}

function flattenPages(pages?: ChatSearchResult[][]) {
  return pages?.flat() ?? [];
}

export default function ChatSearchResults({ query }: Props) {
  const trimmedQuery = query.trim();
  const titleSearch = useChatRoomSearch(trimmedQuery, "title");
  const ownerSearch = useChatRoomSearch(trimmedQuery, "owner");

  if (!trimmedQuery) {
    return <EmptySearchResult message="검색어를 입력하면 채팅방 검색 결과가 표시됩니다." />;
  }

  if (titleSearch.isError || ownerSearch.isError) {
    return <EmptySearchResult message="채팅방 검색 결과를 불러오지 못했습니다." />;
  }

  if (titleSearch.isLoading || ownerSearch.isLoading) {
    return <ChatRoomCardGridSkeleton />;
  }

  const titleResults = flattenPages(titleSearch.data?.pages);
  const ownerResults = flattenPages(ownerSearch.data?.pages);

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {titleResults.length > 0 && (
        <ChatSearchSection
          title="제목"
          description="채팅방 제목 검색 결과입니다."
          results={titleResults}
          hasMore={titleSearch.hasNextPage}
          isFetchingMore={titleSearch.isFetchingNextPage}
          onLoadMore={() => titleSearch.fetchNextPage()}
        />
      )}
      {ownerResults.length > 0 && (
        <ChatSearchSection
          title="닉네임"
          description="방을 생성한 사용자의 닉네임 검색 결과입니다."
          results={ownerResults}
          hasMore={ownerSearch.hasNextPage}
          isFetchingMore={ownerSearch.isFetchingNextPage}
          onLoadMore={() => ownerSearch.fetchNextPage()}
        />
      )}
      {titleResults.length === 0 && ownerResults.length === 0 && (
        <EmptySearchResult message="검색 결과가 없습니다." />
      )}
    </div>
  );
}

function EmptySearchResult({ message }: { message: string }) {
  return (
    <div className="flex min-h-120 w-full items-center justify-center px-4 py-12 text-center">
      <div className="flex max-w-80 flex-col items-center">
        <div
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ring-1",
            "bg-brand/10 ring-brand/20 dark:bg-brand/15",
          )}
        >
          <Search className="text-brand h-7 w-7" />
        </div>
        <h2 className="text-foreground text-base font-bold">채팅방을 찾지 못했습니다</h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
