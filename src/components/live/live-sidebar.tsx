"use client";
// 라이브 탐색 Sidebar를 기존 Sidebar 컴포넌트 계층으로 렌더링합니다.

import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";

import LiveSidebarCategoryItem from "@/components/live/live-sidebar-category-item";
import LiveSidebarChannelItem from "@/components/live/live-sidebar-channel-item";
import LiveSidebarFollowingChannelItem from "@/components/live/live-sidebar-following-channel-item";
import LiveSidebarKeywordItem from "@/components/live/live-sidebar-keyword-item";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
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
  const filterItems = LIVE_LIST_FILTER_OPTIONS.filter(
    (item) => item.value !== "FOLLOWING" || isSignedIn,
  );
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
                  isActive={item.value === LIVE_LIST_DEFAULT_FILTER}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSignedIn ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>팔로잉 채널</SidebarGroupLabel>
              <SidebarGroupContent>
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
                          <SidebarMenuButton
                            onClick={() => void fetchMoreFollowing()}
                            disabled={isFetchingMoreFollowing}
                            className="text-muted-foreground"
                          >
                            <ChevronDown />
                            <span>{isFetchingMoreFollowing ? "불러오는 중" : "더보기"}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ) : isFollowingOverviewVisible ? (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            render={<Link href="/user/following" />}
                            className="text-muted-foreground"
                          >
                            <ExternalLink />
                            <span>전체보기</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-muted-foreground px-2 py-2 text-xs leading-relaxed">
                      아직 팔로잉한 채널이 없어요.
                    </p>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}

        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>지금 뜨는 채널</SidebarGroupLabel>
          <SidebarGroupContent>
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
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>인기 키워드</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {isKeywordLoading ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : keywordItems.length > 0 ? (
                keywordItems.map((item) => (
                  <LiveSidebarKeywordItem key={item.keyword} item={item} />
                ))
              ) : (
                <p className="text-muted-foreground px-2 py-2 text-xs leading-relaxed">
                  아직 인기 키워드가 없어요.
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
