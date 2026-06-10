"use client";
// 라이브 검색 결과를 조회하고 방송/크리에이터 섹션으로 나눠 표시합니다.
import LiveSearchEmptyState from "@/components/search/live-search-empty-state";
import LiveSearchSection from "@/components/search/live-search-section";
import LiveSearchSkeleton from "@/components/search/live-search-skeleton";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useLiveSearchResults } from "@/hooks/search/use-live-search-results";
import { getAppMessage } from "@/utils/common/app-message";

interface Props {
  query: string;
}

export default function LiveSearchResults({ query }: Props) {
  const searchResults = useLiveSearchResults(query);
  const searchLoadFailedMessage = getAppMessage(APP_MESSAGE_CODE.error.search.loadFailed);

  if (searchResults.isEmptyQuery) {
    return (
      <LiveSearchEmptyState
        title="검색어를 입력해 주세요"
        message="검색어를 입력하면 방송 중인 라이브와 크리에이터를 찾아드릴게요."
        tone="brand"
      />
    );
  }

  if (searchResults.isError) {
    return (
      <LiveSearchEmptyState
        title={searchLoadFailedMessage.title}
        message={searchLoadFailedMessage.description ?? ""}
      />
    );
  }

  if (searchResults.isLoading) {
    return <LiveSearchSkeleton />;
  }

  return (
    <div className="flex flex-col gap-9">
      {searchResults.broadcast.results.length > 0 && (
        <LiveSearchSection
          section="broadcast"
          title="라이브 방송"
          description="제목, 크리에이터, 태그에서 찾은 라이브 결과예요."
          results={searchResults.broadcast.results}
          totalCount={searchResults.broadcast.totalCount}
          hasMore={searchResults.broadcast.hasMore}
          isFetchingMore={searchResults.broadcast.isFetchingMore}
          onLoadMore={() => searchResults.broadcast.fetchMore()}
        />
      )}
      {searchResults.creator.results.length > 0 && (
        <LiveSearchSection
          section="creator"
          title="크리에이터"
          description="닉네임에서 찾은 크리에이터 결과예요."
          results={searchResults.creator.results}
          totalCount={searchResults.creator.totalCount}
          hasMore={searchResults.creator.hasMore}
          isFetchingMore={searchResults.creator.isFetchingMore}
          onLoadMore={() => searchResults.creator.fetchMore()}
        />
      )}
      {searchResults.isEmptyResult && (
        <LiveSearchEmptyState
          title="검색 결과가 없습니다"
          message="다른 검색어로 방송 중인 라이브와 크리에이터를 다시 찾아보세요."
        />
      )}
    </div>
  );
}
