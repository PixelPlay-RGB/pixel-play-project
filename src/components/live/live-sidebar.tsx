"use client";
// 라이브 탐색 Sidebar를 기존 Sidebar 컴포넌트 계층으로 렌더링합니다.

import { usePathname, useRouter } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import LoadMoreButton from "@/components/common/load-more-button";
import { SidebarCredits } from "@/components/common/sidebar-credits";
import LiveSidebarCategoryItem from "@/components/live/live-sidebar-category-item";
import LiveSidebarChannelItem from "@/components/live/live-sidebar-channel-item";
import LiveSidebarKeywordItem from "@/components/live/live-sidebar-keyword-item";
import LiveSidebarSection from "@/components/live/live-sidebar-section";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import {
  LIVE_LIST_DEFAULT_FILTER,
  LIVE_LIST_FILTER_ICON,
  LIVE_LIST_FILTER_OPTIONS,
} from "@/constants/live/live-list";
import { useLiveSidebar } from "@/hooks/live/use-live-sidebar";
import { useLiveStore } from "@/stores/live";
import type { LiveListFilter } from "@/types/live/live";

const SIDEBAR_EMPTY_STATE_CLASS = "text-muted-foreground px-2 py-2 text-xs leading-relaxed";

interface LiveSidebarProps {
  isMobile?: boolean;
}

export default function LiveSidebar({ isMobile }: LiveSidebarProps) {
  const {
    viewerId,
    isSignedIn,
    trendingItems,
    followingItems,
    keywordItems,
    followingTotalCount,
    fetchMoreFollowing,
    resetFollowing,
    canFetchMoreFollowing,
    isFetchingMoreFollowing,
    isTrendingLoading,
    isFollowingLoading,
    isKeywordLoading,
  } = useLiveSidebar();
  const router = useRouter();
  const pathname = usePathname();
  // 탐색 필터는 라이브 목록(인덱스 "/")의 인페이지 필터다. "/"가 아닌 곳에서 클릭하면
  // "/"로 이동하며 필터를 적용하고, "/"가 아니면 어떤 필터도 활성(Focus)으로 표시하지 않는다.
  const isLiveListRoute = pathname === "/";
  const filter = useLiveStore((state) => state.filter);
  const sort = useLiveStore((state) => state.sort);
  const visibleCount = useLiveStore((state) => state.visibleCount);
  const setFilter = useLiveStore((state) => state.setFilter);
  const filterItems = LIVE_LIST_FILTER_OPTIONS.filter(
    (item) => item.value !== "FOLLOWING" || isSignedIn,
  );
  const activeFilter = !isSignedIn && filter === "FOLLOWING" ? LIVE_LIST_DEFAULT_FILTER : filter;
  const activeFilterFetchCount = useIsFetching({
    queryKey: QUERY_KEYS.live.list(viewerId, activeFilter, sort, visibleCount),
  });
  const isNavigationVisible = !isMobile;
  const isFollowingOverviewVisible =
    !canFetchMoreFollowing && followingItems.length < followingTotalCount;

  // 필터 선택: 스토어에 적용하고, 라이브 목록(인덱스 "/")이 아니면 "/"로 이동해 해당 필터를 보여준다.
  const handleSelectFilter = (value: LiveListFilter) => {
    setFilter(value);
    if (!isLiveListRoute) {
      router.push("/");
    }
  };

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="bg-background h-full shrink-0 border-r"
    >
      <SidebarContent>
        {isNavigationVisible ? (
          <SidebarGroup>
            <SidebarGroupLabel>탐색</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {filterItems.map((item) => (
                  <LiveSidebarCategoryItem
                    key={item.value}
                    icon={LIVE_LIST_FILTER_ICON[item.value]}
                    label={item.label}
                    value={item.value}
                    isActive={isLiveListRoute && item.value === activeFilter}
                    isLoading={
                      isLiveListRoute && item.value === activeFilter && activeFilterFetchCount > 0
                    }
                    onSelect={handleSelectFilter}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {isSignedIn ? (
          <>
            {isNavigationVisible ? <SidebarSeparator /> : null}
            <LiveSidebarSection
              title="팔로잉 채널"
              onOpenChange={(open) => {
                if (!open) resetFollowing();
              }}
            >
              <SidebarMenu className="gap-1.5">
                {isFollowingLoading ? (
                  <>
                    <SidebarMenuSkeleton showIcon className="gap-4" />
                    <SidebarMenuSkeleton showIcon className="gap-4" />
                    <SidebarMenuSkeleton showIcon className="gap-4" />
                  </>
                ) : followingItems.length > 0 ? (
                  <>
                    {followingItems.map((item) => (
                      <LiveSidebarChannelItem
                        key={`following-${item.creatorId}`}
                        creatorId={item.creatorId}
                        creatorNickname={item.creatorNickname}
                        creatorPhotoUrl={item.creatorPhotoUrl}
                        currentViewerCount={item.currentViewerCount}
                        isFollowing
                        isLive={item.isLive}
                        showLiveRing={item.isLive}
                        showLiveStatus={item.isLive}
                      />
                    ))}
                    {canFetchMoreFollowing ? (
                      <SidebarMenuItem>
                        <LoadMoreButton
                          isLoading={isFetchingMoreFollowing}
                          onClick={() => void fetchMoreFollowing()}
                          accent="live"
                          showSeparators={false}
                        />
                      </SidebarMenuItem>
                    ) : isFollowingOverviewVisible ? (
                      <SidebarMenuItem>
                        <LoadMoreButton
                          isLoading={false}
                          onClick={() => router.push("/user/following")}
                          accent="live"
                          label="전체보기"
                          showSeparators={false}
                          icon={ArrowRight}
                        />
                      </SidebarMenuItem>
                    ) : null}
                  </>
                ) : (
                  <p className={SIDEBAR_EMPTY_STATE_CLASS}>아직 팔로잉한 채널이 없어요.</p>
                )}
              </SidebarMenu>
            </LiveSidebarSection>
          </>
        ) : null}

        {isNavigationVisible || isSignedIn ? <SidebarSeparator /> : null}
        <LiveSidebarSection title="지금 뜨는 채널">
          <SidebarMenu className="gap-1.5">
            {isTrendingLoading ? (
              <>
                <SidebarMenuSkeleton showIcon className="gap-4" />
                <SidebarMenuSkeleton showIcon className="gap-4" />
                <SidebarMenuSkeleton showIcon className="gap-4" />
              </>
            ) : trendingItems.length > 0 ? (
              trendingItems.map((item) => (
                <LiveSidebarChannelItem
                  key={`trending-${item.id}`}
                  creatorId={item.creatorId}
                  creatorNickname={item.creatorNickname}
                  creatorPhotoUrl={item.creatorPhotoUrl}
                  currentViewerCount={item.currentViewerCount}
                  isFollowing={item.isFollowing}
                  isLive
                  showLiveRing
                  showLiveStatus
                />
              ))
            ) : (
              <p className={SIDEBAR_EMPTY_STATE_CLASS}>아직 뜨는 채널을 찾는 중이에요.</p>
            )}
          </SidebarMenu>
        </LiveSidebarSection>

        <SidebarSeparator />
        <LiveSidebarSection title="인기 키워드">
          <SidebarMenu className="gap-1.5">
            {isKeywordLoading ? (
              <>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </>
            ) : keywordItems.length > 0 ? (
              keywordItems.map((item) => <LiveSidebarKeywordItem key={item.keyword} item={item} />)
            ) : (
              <p className={SIDEBAR_EMPTY_STATE_CLASS}>아직 인기 키워드가 없어요.</p>
            )}
          </SidebarMenu>
        </LiveSidebarSection>
      </SidebarContent>

      <SidebarFooter className="gap-0 p-0">
        <Separator />
        <SidebarCredits />
      </SidebarFooter>
    </Sidebar>
  );
}
