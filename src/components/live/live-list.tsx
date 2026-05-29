"use client";
// 라이브 목록 화면의 클라이언트 상호작용을 조립합니다.

import type { ReactNode } from "react";

import LoadMoreButton from "@/components/common/load-more-button";
import LiveCard from "@/components/live/live-card";
import LiveListEmptyState from "@/components/live/live-list-empty-state";
import LiveListErrorState from "@/components/live/live-list-error-state";
import LiveListSkeleton from "@/components/live/live-list-skeleton";
import LiveListToolbar from "@/components/live/live-list-toolbar";
import { useLiveList } from "@/hooks/live/use-live-list";
import { useLiveStore } from "@/stores/live";
import { EMPTY_LIVE_LIST_SNAPSHOT } from "@/utils/live/live-list";

interface LiveListProps {
  heroSlot: ReactNode;
}

export default function LiveList({ heroSlot }: LiveListProps) {
  const setSort = useLiveStore((state) => state.setSort);
  const showMore = useLiveStore((state) => state.showMore);
  const query = useLiveList();
  const snapshot = query.data ?? EMPTY_LIVE_LIST_SNAPSHOT;
  const isInitialLoading = !query.isFetched && (!query.isUserFetched || query.isLoading);
  const isEmpty = !isInitialLoading && !query.isError && snapshot.items.length === 0;
  const isFetchingMore = query.isFetching && query.isPlaceholderData;

  return (
    <div className="flex min-w-0 flex-col gap-5 md:gap-6">
      {heroSlot}
      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-foreground text-xl font-bold md:text-2xl">지금 방송 중</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                보고 싶은 방송을 바로 골라보세요.
              </p>
            </div>
            <LiveListToolbar sort={query.sort} onSortChange={setSort} />
          </div>
        </div>

        {query.isError ? (
          <LiveListErrorState onRetry={() => void query.refetch()} />
        ) : isInitialLoading ? (
          <LiveListSkeleton />
        ) : isEmpty ? (
          <LiveListEmptyState filter={query.effectiveFilter} />
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {snapshot.items.map((item) => (
              <LiveCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!query.isError && snapshot.hasMore ? (
          <LoadMoreButton isLoading={isFetchingMore} onClick={showMore} accent="live" />
        ) : null}
      </section>
    </div>
  );
}
