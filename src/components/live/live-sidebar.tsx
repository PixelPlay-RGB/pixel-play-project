"use client";
// 라이브 탐색 Sidebar를 기존 Sidebar 컴포넌트 계층으로 렌더링합니다.

import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";

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
import {
  LIVE_LIST_DEFAULT_FILTER,
  LIVE_LIST_FILTER_ICON,
  LIVE_LIST_FILTER_OPTIONS,
} from "@/constants/live/live-list";
import { useLiveSidebar } from "@/hooks/live/use-live-sidebar";
import { useLiveStore } from "@/stores/live";

interface LiveSidebarProps {
  isMobile?: boolean;
}

export default function LiveSidebar({ isMobile }: LiveSidebarProps) {
  const {
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
  const filter = useLiveStore((state) => state.filter);
  const setFilter = useLiveStore((state) => state.setFilter);
  const filterItems = LIVE_LIST_FILTER_OPTIONS.filter(
    (item) => item.value !== "FOLLOWING" || isSignedIn,
  );
  const activeFilter = !isSignedIn && filter === "FOLLOWING" ? LIVE_LIST_DEFAULT_FILTER : filter;
  const isFollowingOverviewVisible =
    !canFetchMoreFollowing && followingItems.length < followingTotalCount;

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="bg-background h-full shrink-0 border-r"
    >
      <SidebarContent>
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
                  onSelect={setFilter}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSignedIn ? (
          <>
            <SidebarSeparator />
            <LiveSidebarSection title="팔로잉 채널">
              <SidebarMenu className="gap-1.5">
                {isFollowingLoading ? (
                  <>
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
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
                        <button
                          type="button"
                          onClick={() => void fetchMoreFollowing()}
                          disabled={isFetchingMoreFollowing}
                          className="border-border text-muted-foreground hover:border-live/40 hover:text-live mx-auto mt-1 inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold transition-colors disabled:pointer-events-none disabled:opacity-60"
                        >
                          <ChevronDown className="size-3.5" />
                          <span>{isFetchingMoreFollowing ? "불러오는 중" : "더보기"}</span>
                        </button>
                      </SidebarMenuItem>
                    ) : isFollowingOverviewVisible ? (
                      <SidebarMenuItem>
                        <Link
                          href="/user/following"
                          className="border-border text-muted-foreground hover:border-live/40 hover:text-live mx-auto mt-1 inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>전체보기</span>
                        </Link>
                      </SidebarMenuItem>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted-foreground px-2 py-2 text-xs leading-relaxed">
                    아직 팔로잉한 채널이 없어요.
                  </p>
                )}
              </SidebarMenu>
            </LiveSidebarSection>
          </>
        ) : null}

        <SidebarSeparator />
        <LiveSidebarSection title="지금 뜨는 채널">
          <SidebarMenu className="gap-1.5">
            {isTrendingLoading ? (
              <>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </>
            ) : trendingItems.length > 0 ? (
              trendingItems.map((item) => (
                <LiveSidebarChannelItem key={`trending-${item.id}`} item={item} />
              ))
            ) : (
              <p className="text-muted-foreground px-2 py-2 text-xs leading-relaxed">
                아직 뜨는 채널을 찾는 중이에요.
              </p>
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
              <p className="text-muted-foreground px-2 py-2 text-xs leading-relaxed">
                아직 인기 키워드가 없어요.
              </p>
            )}
          </SidebarMenu>
        </LiveSidebarSection>
      </SidebarContent>
    </Sidebar>
  );
}
