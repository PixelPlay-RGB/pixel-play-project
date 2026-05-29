// 라이브 Sidebar의 채널 항목을 렌더링합니다.

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LiveSidebarLiveStatus from "@/components/live/live-sidebar-live-status";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { LiveListItem } from "@/types/live/live";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface LiveSidebarChannelItemProps {
  item: LiveListItem;
}

export default function LiveSidebarChannelItem({ item }: LiveSidebarChannelItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={`/live/${item.creatorId}`} />}
        className="h-auto gap-2 py-2"
      >
        <Avatar className="ring-brand/70 size-7 ring-2" size="sm">
          <AvatarImage
            src={getAvatarImageSrc(item.creatorPhotoUrl)}
            alt={`${item.creatorNickname} 프로필 이미지`}
          />
          <AvatarFallback>{getAvatarFallbackText(item.creatorNickname, 1)}</AvatarFallback>
        </Avatar>
        <span className="text-sidebar-foreground min-w-0 flex-1 truncate text-xs font-bold">
          {item.creatorNickname}
        </span>
        <LiveSidebarLiveStatus isLive viewerCount={item.currentViewerCount} />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
