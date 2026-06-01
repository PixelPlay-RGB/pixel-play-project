// 라이브 Sidebar의 인기 키워드 항목을 렌더링합니다.

import Link from "next/link";
import { Hash } from "lucide-react";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { LivePopularKeywordItem } from "@/types/live/live";
import { createLiveSearchHref, formatViewerCountLabel } from "@/utils/live/live-list";

interface LiveSidebarKeywordItemProps {
  item: LivePopularKeywordItem;
}

export default function LiveSidebarKeywordItem({ item }: LiveSidebarKeywordItemProps) {
  const href = createLiveSearchHref(item.keyword);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={href} />} className="h-auto gap-5 py-2">
        <Hash className="text-brand" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sidebar-foreground truncate text-xs font-bold">{item.keyword}</span>
          <span className="text-muted-foreground truncate text-xs">
            방송 {item.liveCount}개 · {formatViewerCountLabel(item.viewerCount)}
          </span>
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
