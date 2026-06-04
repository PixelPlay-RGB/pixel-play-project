"use client";
// 라이브 탐색 Sidebar를 기존 Sidebar 컴포넌트 계층으로 렌더링합니다.

import { useRouter } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";

import LoadMoreButton from "@/components/common/load-more-button";
import LiveSidebarCategoryItem from "@/components/live/live-sidebar-category-item";
import LiveSidebarChannelItem from "@/components/live/live-sidebar-channel-item";
import LiveSidebarFollowingChannelItem from "@/components/live/live-sidebar-following-channel-item";
import LiveSidebarKeywordItem from "@/components/live/live-sidebar-keyword-item";
import LiveSidebarSection from "@/components/live/live-sidebar-section";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import {
  LIVE_LIST_DEFAULT_FILTER,
  LIVE_LIST_FILTER_ICON,
  LIVE_LIST_FILTER_OPTIONS,
} from "@/constants/live/live-list";
import { useLiveSidebar } from "@/hooks/live/use-live-sidebar";
import { useLiveStore } from "@/stores/live";

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
    canFetchMoreFollowing,
    isFetchingMoreFollowing,
    isTrendingLoading,
    isFollowingLoading,
    isKeywordLoading,
  } = useLiveSidebar();
  const router = useRouter();
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
                    isActive={item.value === activeFilter}
                    isLoading={item.value === activeFilter && activeFilterFetchCount > 0}
                    onSelect={setFilter}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {isSignedIn ? (
          <>
            {isNavigationVisible ? <SidebarSeparator /> : null}
            <LiveSidebarSection title="팔로잉 채널">
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
                      <LiveSidebarFollowingChannelItem
                        key={`following-${item.creatorId}`}
                        item={item}
                      />
                    ))}
                    {canFetchMoreFollowing ? (
                      <SidebarMenuItem>
                        <LoadMoreButton
                          isLoading={isFetchingMoreFollowing}
                          onClick={() => void fetchMoreFollowing()}
                          accent="live"
                        />
                      </SidebarMenuItem>
                    ) : isFollowingOverviewVisible ? (
                      <SidebarMenuItem>
                        <LoadMoreButton
                          isLoading={false}
                          onClick={() => router.push("/user/following")}
                          accent="live"
                          label="전체보기"
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
                <LiveSidebarChannelItem key={`trending-${item.id}`} item={item} />
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
    </Sidebar>
  );
}
