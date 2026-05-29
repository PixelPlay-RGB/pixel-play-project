// 라이브 Sidebar의 채널 항목을 렌더링합니다.

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { LiveListItem } from "@/types/live/live";
import { formatViewerCount } from "@/utils/live/live-list";
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
        <Avatar className="size-7" size="sm">
          <AvatarImage
            src={getAvatarImageSrc(item.creatorPhotoUrl)}
            alt={`${item.creatorNickname} 프로필 이미지`}
          />
          <AvatarFallback>{getAvatarFallbackText(item.creatorNickname, 1)}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sidebar-foreground truncate text-xs font-bold">
            {item.creatorNickname}
          </span>
          <span className="text-muted-foreground truncate text-xs">
            {formatViewerCount(item.currentViewerCount)}
          </span>
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
