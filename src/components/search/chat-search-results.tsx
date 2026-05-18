"use client";
// 채팅방 검색 결과를 조회하고 제목/방장 섹션으로 나눠 표시합니다.
import ChatRoomCardGridSkeleton from "@/components/chat-room/shared/chat-room-card-grid-skeleton";
import ChatSearchSection from "@/components/search/chat-search-section";
import { useChatRoomSearchResults } from "@/hooks/search/use-chat-room-search-results";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface Props {
  query: string;
}

export default function ChatSearchResults({ query }: Props) {
  const searchResults = useChatRoomSearchResults(query);

  if (searchResults.isEmptyQuery) {
    return (
      <EmptySearchResult
        title="검색어를 입력해 주세요"
        message="검색어를 입력하면 채팅방 검색 결과가 표시됩니다."
      />
    );
  }

  if (searchResults.isError) {
    return (
      <EmptySearchResult
        title="검색 결과를 불러오지 못했습니다"
        message="잠시 후 다시 검색해 주세요."
      />
    );
  }

  if (searchResults.isLoading) {
    return <ChatRoomCardGridSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {searchResults.title.results.length > 0 && (
        <ChatSearchSection
          title="제목"
          description="채팅방 제목 검색 결과입니다."
          results={searchResults.title.results}
          hasMore={searchResults.title.hasMore}
          isFetchingMore={searchResults.title.isFetchingMore}
          onLoadMore={() => searchResults.title.fetchMore()}
        />
      )}
      {searchResults.owner.results.length > 0 && (
        <ChatSearchSection
          title="닉네임"
          description="방을 생성한 사용자의 닉네임 검색 결과입니다."
          results={searchResults.owner.results}
          hasMore={searchResults.owner.hasMore}
          isFetchingMore={searchResults.owner.isFetchingMore}
          onLoadMore={() => searchResults.owner.fetchMore()}
        />
      )}
      {searchResults.isEmptyResult && (
        <EmptySearchResult
          title="검색 결과가 없습니다"
          message="다른 검색어로 다시 시도해 주세요."
        />
      )}
    </div>
  );
}

function EmptySearchResult({ title, message }: { title: string; message: string }) {
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
        <h2 className="text-foreground text-base font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
