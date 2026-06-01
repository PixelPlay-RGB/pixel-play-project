"use client";
// 팔로잉 채널 페이지의 데이터 조회·필터·목록 렌더링을 담당하는 클라이언트 섹션입니다.

import { useState } from "react";
import { UserRoundCheck } from "lucide-react";

import FollowingChannelListSkeleton from "@/components/following/following-channel-list-skeleton";
import FollowingChannelRow from "@/components/following/following-channel-row";
import FollowingEmptyState from "@/components/following/following-empty-state";
import FollowingSummaryCard from "@/components/following/following-summary-card";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard, SideTipStep } from "@/components/common/side-tip-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FOLLOWING_FILTER_TABS } from "@/constants/following/following-page";
import { useFollowingChannelPage } from "@/hooks/following/use-following-channel-page";
import type { FollowingChannelFilter } from "@/types/following/following-page";

const FOLLOWING_PAGE_HEADER = {
  kicker: "팔로우 관리",
  title: "팔로잉한 채널을 모아봐요",
  description: "팔로우한 크리에이터의 라이브와 최근 방송을 한곳에서 확인할 수 있어요.",
} as const;

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
  const filteredTotal = filter === "LIVE" ? liveCount : totalCount;
  const hasChannels = totalCount > 0;

  return (
    <SettingsPage {...FOLLOWING_PAGE_HEADER}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <SettingsCard
            title="팔로잉 채널"
            description="라이브 중인 채널을 먼저 보여드려요."
            contentClassName="gap-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Tabs
                value={filter}
                onValueChange={(value) => setFilter(value as FollowingChannelFilter)}
              >
                <TabsList>
                  {FOLLOWING_FILTER_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {hasChannels && !isInitialLoading && (
                <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
                  {filteredTotal}명
                </span>
              )}
            </div>

            {renderContent()}
          </SettingsCard>
        </div>

        <div className="flex flex-col gap-5 xl:w-120 xl:shrink-0">
          {hasChannels && !isInitialLoading && (
            <FollowingSummaryCard
              totalCount={totalCount}
              liveCount={liveCount}
              recentBroadcastCount={recentBroadcastCount}
            />
          )}

          <SideTipCard
            icon={<UserRoundCheck className="size-5" />}
            title="팔로잉을 더 잘 활용해요"
            description={`팔로우한 채널의 방송 소식을 이곳에서 모아볼 수 있어요.\n라이브 중인 채널은 항상 위쪽에 먼저 보여드려요.`}
          >
            <SideTipStep
              number="1"
              title="라이브를 먼저 확인해요"
              description={`'라이브 중' 탭을 누르면 지금 방송 중인 채널만 모아볼 수 있어요.`}
            />
            <SideTipStep
              number="2"
              title="방송으로 바로 이동해요"
              description={`채널이나 보러가기 버튼을 누르면 방송 페이지로 바로 이동해요.`}
            />
            <SideTipStep
              number="3"
              title="팔로우를 정리해요"
              description={`팔로잉 버튼을 누르면 언제든 팔로우를 해제할 수 있어요.`}
            />
          </SideTipCard>
        </div>
      </div>
    </SettingsPage>
  );

  function renderContent() {
    if (isInitialLoading) {
      return <FollowingChannelListSkeleton />;
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="text-foreground text-sm font-semibold">목록을 불러오지 못했어요.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            다시 시도
          </Button>
        </div>
      );
    }

    if (totalCount === 0) {
      return (
        <FollowingEmptyState
          title="아직 팔로우한 크리에이터가 없어요"
          description="관심 있는 채널을 팔로우하면 이곳에서 모아볼 수 있어요."
          showBrowseCta
        />
      );
    }

    if (visibleItems.length === 0) {
      return (
        <FollowingEmptyState
          title="지금 라이브 중인 채널이 없어요"
          description="팔로우한 크리에이터가 방송을 시작하면 여기에 표시돼요."
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => (
            <FollowingChannelRow key={item.creatorId} item={item} />
          ))}
        </ul>

        {hasNextPage && (
          <div className="flex justify-center pt-1">
            <Button
              variant="outline"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? <Spinner /> : null}더 보기
            </Button>
          </div>
        )}
      </div>
    );
  }
}
