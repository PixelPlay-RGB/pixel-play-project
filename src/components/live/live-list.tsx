"use client";
// 라이브 목록 화면의 클라이언트 상호작용을 조립합니다.

import { useCallback, type ReactNode } from "react";

import LoadMoreButton from "@/components/common/load-more-button";
import LiveCard from "@/components/live/live-card";
import LiveListEmptyState from "@/components/live/live-list-empty-state";
import LiveListErrorState from "@/components/live/live-list-error-state";
import LiveListSkeleton from "@/components/live/live-list-skeleton";
import LiveListToolbar from "@/components/live/live-list-toolbar";
import LiveMobileFilterChips from "@/components/live/live-mobile-filter-chips";
import { LIVE_LIST_SORT_TITLE } from "@/constants/live/live-list";
import { useLiveListPageSize } from "@/hooks/live/use-live-list-page-size";
import { useLiveList } from "@/hooks/live/use-live-list";
import { useLiveStore } from "@/stores/live";
import { EMPTY_LIVE_LIST_SNAPSHOT } from "@/utils/live/live-list";

interface LiveListProps {
  heroSlot: ReactNode;
  heroId?: string | null;
}

export default function LiveList({ heroSlot, heroId }: LiveListProps) {
  const setFilter = useLiveStore((state) => state.setFilter);
  const setSort = useLiveStore((state) => state.setSort);
  const setPageSize = useLiveStore((state) => state.setPageSize);
  const showMore = useLiveStore((state) => state.showMore);
  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      setPageSize(pageSize);
    },
    [setPageSize],
  );
  const pageSize = useLiveListPageSize({ onPageSizeChange: handlePageSizeChange });
  const query = useLiveList(pageSize !== null, heroId);
  const snapshot = query.data ?? EMPTY_LIVE_LIST_SNAPSHOT;
  const visibleItems = snapshot.items;
  const isInitialLoading =
    pageSize === null || (!query.isFetched && (!query.isUserFetched || query.isLoading));
  const isEmpty = !isInitialLoading && !query.isError && visibleItems.length === 0;
  const isFetchingMore = query.isFetching && query.isPlaceholderData;
  const listTitle = LIVE_LIST_SORT_TITLE[query.sort];

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-5 md:gap-6">
      {heroSlot}
      <LiveMobileFilterChips
        activeFilter={query.effectiveFilter}
        isFollowingVisible={query.isFollowingFilterVisible}
        isFetching={query.isFetching}
        onFilterChange={setFilter}
      />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-foreground text-xl font-bold md:text-2xl">{listTitle}</h2>
            <LiveListToolbar sort={query.sort} onSortChange={setSort} />
          </div>
        </div>

        {query.isError ? (
          <LiveListErrorState onRetry={() => void query.refetch()} />
        ) : isInitialLoading ? (
          <LiveListSkeleton count={pageSize ?? undefined} />
        ) : isEmpty ? (
          <LiveListEmptyState filter={query.effectiveFilter} />
        ) : visibleItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibleItems.map((item) => (
              <LiveCard key={item.id} item={item} />
            ))}
          </div>
        ) : null}

        {!query.isError && snapshot.hasMore ? (
          <LoadMoreButton isLoading={isFetchingMore} onClick={showMore} accent="live" />
        ) : null}
      </section>
    </div>
  );
}
