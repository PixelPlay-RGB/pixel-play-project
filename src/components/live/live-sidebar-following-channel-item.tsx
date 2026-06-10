// 라이브 Sidebar의 팔로잉 채널 항목을 렌더링합니다.

import Link from "next/link";

import CreatorAvatarPopover from "@/components/creator/creator-avatar-popover";
import LiveSidebarLiveStatus from "@/components/live/live-sidebar-live-status";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { FollowingChannelItem } from "@/types/live/live";

interface LiveSidebarFollowingChannelItemProps {
  item: FollowingChannelItem;
}

export default function LiveSidebarFollowingChannelItem({
  item,
}: LiveSidebarFollowingChannelItemProps) {
  return (
    <SidebarMenuItem className="flex items-center gap-1">
      <CreatorAvatarPopover
        creatorId={item.creatorId}
        creatorNickname={item.creatorNickname}
        creatorPhotoUrl={item.creatorPhotoUrl}
        isFollowing
        isLive={item.isLive}
        showLiveRing={item.isLive}
        avatarSize="sm"
        avatarClassName="size-7"
        triggerClassName="ml-1"
      />
      <SidebarMenuButton
        render={<Link href={`/live/${item.creatorId}`} />}
        className="h-auto w-auto min-w-0 flex-1 gap-2 py-2"
      >
        <span className="text-sidebar-foreground min-w-0 flex-1 truncate text-xs font-bold">
          {item.creatorNickname}
        </span>
        {item.isLive && (
          <LiveSidebarLiveStatus isLive={item.isLive} viewerCount={item.currentViewerCount} />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
