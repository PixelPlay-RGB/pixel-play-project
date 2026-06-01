"use client";
// 팔로잉 채널 페이지의 데이터 조회·필터·목록 렌더링을 담당하는 클라이언트 섹션입니다.

import { useState } from "react";

import FollowingChannelCard from "@/components/following/following-channel-card";
import FollowingChannelListSkeleton from "@/components/following/following-channel-list-skeleton";
import FollowingEmptyState from "@/components/following/following-empty-state";
import FollowingStats from "@/components/following/following-stats";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FOLLOWING_FILTER_TABS } from "@/constants/following/following-page";
import { useFollowingChannelPage } from "@/hooks/following/use-following-channel-page";
import type { FollowingChannelFilter } from "@/types/following/following-page";

export default function FollowingChannelSection() {
  const [filter, setFilter] = useState<FollowingChannelFilter>("ALL");
  const {
    items,
    totalCount,
    liveCount,
    recentBroadcastCount,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSignedIn,
    isUserFetched,
  } = useFollowingChannelPage();

  const visibleItems = filter === "LIVE" ? items.filter((item) => item.isLive) : items;
  const isInitialLoading = !isUserFetched || (isSignedIn && isLoading);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FollowingChannelFilter)}>
          <TabsList>
            {FOLLOWING_FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {totalCount > 0 ? (
        <FollowingStats
          totalCount={totalCount}
          liveCount={liveCount}
          recentBroadcastCount={recentBroadcastCount}
        />
      ) : null}

      {isInitialLoading ? (
        <FollowingChannelListSkeleton />
      ) : isError ? (
        <div className="border-destructive/20 bg-destructive/5 flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center">
          <p className="text-foreground text-sm font-semibold">목록을 불러오지 못했어요.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            다시 시도
          </Button>
        </div>
      ) : totalCount === 0 ? (
        <FollowingEmptyState
          title="아직 팔로우한 크리에이터가 없어요"
          description="관심 있는 채널을 팔로우하면 이곳에서 모아볼 수 있어요."
          showBrowseCta
        />
      ) : visibleItems.length === 0 ? (
        <FollowingEmptyState
          title="지금 라이브 중인 채널이 없어요"
          description="팔로우한 크리에이터가 방송을 시작하면 여기에 표시돼요."
        />
      ) : (
        <div className="space-y-4">
          <ul className="space-y-2.5">
            {visibleItems.map((item) => (
              <FollowingChannelCard key={item.creatorId} item={item} />
            ))}
          </ul>

          {hasNextPage ? (
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? <Spinner /> : null}더 보기
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
