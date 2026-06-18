// 라이브 Sidebar의 채널 항목을 렌더링합니다.
// "지금 뜨는 채널"(라이브 목록)과 "팔로잉 채널" 항목이 동일한 구조라 prop으로 차이만 받습니다.

import Link from "next/link";

import CreatorAvatarPopover from "@/components/creator/creator-avatar-popover";
import LiveSidebarLiveStatus from "@/components/live/live-sidebar-live-status";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface LiveSidebarChannelItemProps {
  creatorId: string;
  creatorNickname: string;
  creatorPhotoUrl: string | null;
  currentViewerCount: number;
  // 아바타 팝오버의 팔로우 버튼 초기 상태(팔로잉 섹션은 항상 true).
  isFollowing: boolean;
  // 현재 라이브 여부 — 상태 칩의 라이브/쉬는 중 표기와 아바타 라이브 링에 함께 쓴다.
  isLive: boolean;
  // 아바타에 상시 라이브 링을 노출할지(라이브 목록은 항상, 팔로잉은 라이브일 때만).
  showLiveRing: boolean;
  // 라이브 상태 칩을 노출할지(라이브 목록은 항상, 팔로잉은 라이브일 때만).
  showLiveStatus: boolean;
}

export default function LiveSidebarChannelItem({
  creatorId,
  creatorNickname,
  creatorPhotoUrl,
  currentViewerCount,
  isFollowing,
  isLive,
  showLiveRing,
  showLiveStatus,
}: LiveSidebarChannelItemProps) {
  return (
    <SidebarMenuItem className="flex items-center gap-1">
      <CreatorAvatarPopover
        creatorId={creatorId}
        creatorNickname={creatorNickname}
        creatorPhotoUrl={creatorPhotoUrl}
        isFollowing={isFollowing}
        isLive={isLive}
        showLiveRing={showLiveRing}
        avatarSize="sm"
        avatarClassName="size-7"
        triggerClassName="ml-1"
      />
      <SidebarMenuButton
        render={<Link href={`/live/${creatorId}`} />}
        className="h-auto w-auto min-w-0 flex-1 gap-2 py-2"
      >
        <span className="text-sidebar-foreground min-w-0 flex-1 truncate text-xs font-bold">
          {creatorNickname}
        </span>
        {showLiveStatus && (
          <LiveSidebarLiveStatus isLive={isLive} viewerCount={currentViewerCount} />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
