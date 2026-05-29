"use client";
// 라이브 목록 화면의 클라이언트 상호작용을 조립합니다.

import LiveCard from "@/components/live/live-card";
import LiveHero from "@/components/live/live-hero";
import LiveListEmptyState from "@/components/live/live-list-empty-state";
import LiveListErrorState from "@/components/live/live-list-error-state";
import LiveListSkeleton from "@/components/live/live-list-skeleton";
import LiveListToolbar from "@/components/live/live-list-toolbar";
import { Button } from "@/components/ui/button";
import { useLiveList } from "@/hooks/live/use-live-list";
import { useLiveStore } from "@/stores/live";
import type { LiveHeroItem } from "@/types/live/live";
import { EMPTY_LIVE_LIST_SNAPSHOT } from "@/utils/live/live-list";

interface LiveListProps {
  initialHero: LiveHeroItem | null;
}

export default function LiveList({ initialHero }: LiveListProps) {
  const setFilter = useLiveStore((state) => state.setFilter);
  const setSort = useLiveStore((state) => state.setSort);
  const showMore = useLiveStore((state) => state.showMore);
  const query = useLiveList();
  const snapshot = query.data ?? EMPTY_LIVE_LIST_SNAPSHOT;
  const isInitialLoading = !query.isFetched && (!query.isUserFetched || query.isLoading);
  const isEmpty = !isInitialLoading && !query.isError && snapshot.items.length === 0;
  const isFetchingMore = query.isFetching && query.isPlaceholderData;

  return (
    <div className="flex min-h-full flex-col gap-7 md:gap-9">
      <LiveHero hero={initialHero} />

      <section className="flex flex-col gap-4">
        <div className="space-y-2">
          <p className="text-live text-sm font-bold">라이브 둘러보기</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h2 className="text-foreground text-2xl font-bold">지금 볼 수 있는 방송</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                보고 싶은 분위기에 맞춰 방송을 골라보세요.
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              전체 {snapshot.totalCount.toLocaleString("ko-KR")}개
            </p>
          </div>
        </div>

        <LiveListToolbar
          filter={query.effectiveFilter}
          sort={query.sort}
          isFollowingVisible={query.isFollowingFilterVisible}
          onFilterChange={setFilter}
          onSortChange={setSort}
        />

        {query.isError ? (
          <LiveListErrorState onRetry={() => void query.refetch()} />
        ) : isInitialLoading ? (
          <LiveListSkeleton />
        ) : isEmpty ? (
          <LiveListEmptyState filter={query.effectiveFilter} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {snapshot.items.map((item) => (
              <LiveCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!query.isError && snapshot.hasMore ? (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={showMore}
              disabled={query.isFetching}
            >
              {isFetchingMore ? "불러오는 중" : "더 보기"}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
