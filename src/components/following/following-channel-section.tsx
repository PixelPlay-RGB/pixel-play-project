"use client";
// 팔로잉 채널 페이지의 데이터 조회·필터·목록 렌더링을 담당하는 클라이언트 섹션입니다.

import { useEffect, useState } from "react";
import { UserRoundCheck } from "lucide-react";

import ListPagination from "@/components/common/list-pagination";
import FollowingChannelListSkeleton from "@/components/following/following-channel-list-skeleton";
import FollowingChannelRow from "@/components/following/following-channel-row";
import FollowingEmptyState from "@/components/following/following-empty-state";
import FollowingSummaryCard from "@/components/following/following-summary-card";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard, SideTipStep } from "@/components/common/side-tip-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  FOLLOWING_EMPTY_MESSAGES,
  FOLLOWING_FILTER_TABS,
} from "@/constants/following/following-page";
import { useFollowingChannelPage } from "@/hooks/following/use-following-channel-page";
import type { FollowingChannelFilter } from "@/types/following/following-page";
import { getAppMessage } from "@/utils/common/app-message";

const FOLLOWING_PAGE_HEADER = {
  kicker: "팔로우 관리",
  title: "팔로잉한 채널을 모아봐요",
  description: "팔로우한 크리에이터의 라이브와 최근 방송을 한곳에서 확인할 수 있어요.",
} as const;

export default function FollowingChannelSection() {
  const [filter, setFilter] = useState<FollowingChannelFilter>("ALL");
  const [page, setPage] = useState(1);

  const {
    items,
    totalCount,
    liveCount,
    recentBroadcastCount,
    filteredCount,
    totalPages,
    isLoading,
    isError,
    isFetching,
    isPlaceholderData,
    refetch,
    isSignedIn,
    isUserFetched,
  } = useFollowingChannelPage(filter, page);

  // 언팔로우 등으로 현재 페이지가 전체 페이지 수를 넘기면 마지막 페이지로 보정합니다.
  useEffect(() => {
    if (page > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleFilterChange = (value: FollowingChannelFilter) => {
    if (value === filter) return;
    setFilter(value);
    setPage(1);
  };

  const isInitialLoading = !isUserFetched || (isSignedIn && isLoading);
  const isPageFetching = isFetching && isPlaceholderData;
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
                onValueChange={(value) => handleFilterChange(value as FollowingChannelFilter)}
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
                  {filteredCount}명
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
              title="채널을 빠르게 살펴봐요"
              description={`아바타를 누르면 채널 요약과 이동·팔로우 관리를 바로 할 수 있어요.`}
            />
            <SideTipStep
              number="3"
              title="팔로우를 정리해요"
              description={`아바타 메뉴의 팔로잉 버튼으로 언제든 팔로우를 해제할 수 있어요.`}
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
      const errorMessage = getAppMessage(APP_MESSAGE_CODE.error.following.loadFailed);

      return (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="text-foreground text-sm font-semibold">{errorMessage.title}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            다시 시도
          </Button>
        </div>
      );
    }

    if (totalCount === 0) {
      return (
        <FollowingEmptyState
          title={FOLLOWING_EMPTY_MESSAGES.noFollowing.title}
          description={FOLLOWING_EMPTY_MESSAGES.noFollowing.description}
          showBrowseCta
        />
      );
    }

    if (filteredCount === 0) {
      return (
        <FollowingEmptyState
          title={FOLLOWING_EMPTY_MESSAGES.noLive.title}
          description={FOLLOWING_EMPTY_MESSAGES.noLive.description}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <FollowingChannelRow key={item.creatorId} item={item} />
          ))}
        </ul>

        <ListPagination
          currentPage={page}
          totalPages={totalPages}
          isFetching={isPageFetching}
          onPageChange={setPage}
        />
      </div>
    );
  }
}
